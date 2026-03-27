/**
 * 端對端測試：上傳圖片到 Cloudflare R2 + 寫入 TiDB
 */
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

// ── Cloudflare R2 設定 ──────────────────────────────────────────────
const R2_ACCOUNT_ID = "d4dbdd11c1db22961203972fd5c46b06";
const R2_ACCESS_KEY_ID = "d1908a2d75c6af2adfccb1f587dc811a";
const R2_SECRET_ACCESS_KEY = "168b4fd65f3fe105dceb48e706724e08e10cad5f262fee05da936253c934db1a";
const R2_BUCKET = "ordersome-b2b";
const R2_PUBLIC_URL_PREFIX = "https://pub-344b4e8c0e374787a0dd2b2024ee46c6.r2.dev";

// ── TiDB 設定 ──────────────────────────────────────────────────────
const TIDB_CONFIG = {
  host: "gateway01.ap-northeast-1.prod.aws.tidbcloud.com",
  port: 4000,
  user: "2PEiAB7nB6htiep.root",
  password: "Y9QkbXSPa0Zgulq0",
  database: "ordersome",
  ssl: { rejectUnauthorized: true },
};

// ── 圖片清單 ──────────────────────────────────────────────────────
const IMAGES = [
  {
    localPath: "/tmp/來點什麼-辣椒醬單入_compressed.webp",
    r2Key: "images/chili-sauce-single.webp",
    productName: "台韓辣椒醬（單瓶）",
    slug: "chili-sauce-single",
  },
  {
    localPath: "/tmp/來點什麼-辣椒醬兩入_compressed.webp",
    r2Key: "images/chili-sauce-double.webp",
    productName: "台韓辣椒醬（兩入組）",
    slug: "chili-sauce-double",
  },
];

// ── 初始化 R2 Client ──────────────────────────────────────────────
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function uploadToR2(localPath, r2Key) {
  const fileBuffer = fs.readFileSync(localPath);
  const fileSize = fileBuffer.length;

  console.log(`\n📤 上傳中: ${path.basename(localPath)} (${(fileSize / 1024).toFixed(1)} KB)`);
  console.log(`   R2 路徑: ${R2_BUCKET}/${r2Key}`);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: r2Key,
    Body: fileBuffer,
    ContentType: "image/webp",
    ContentLength: fileSize,
  });

  const response = await r2Client.send(command);
  const statusCode = response.$metadata.httpStatusCode;
  const publicUrl = `${R2_PUBLIC_URL_PREFIX}/${r2Key}`;

  console.log(`   ✅ R2 API 回應狀態碼: HTTP ${statusCode}`);
  console.log(`   🔗 完整公開 URL: ${publicUrl}`);

  return { statusCode, publicUrl };
}

async function writeToTiDB(conn, productName, slug, imageUrl, imagesJson) {
  console.log(`\n📝 寫入 TiDB: ${productName}`);
  console.log(`   imageUrl: ${imageUrl}`);
  console.log(`   images: ${imagesJson}`);

  // 先查詢商品是否存在
  const [rows] = await conn.execute(
    "SELECT id, name, slug FROM products WHERE name = ? OR slug = ? LIMIT 1",
    [productName, slug]
  );

  if (rows.length === 0) {
    console.log(`   ⚠️  找不到商品 "${productName}"，嘗試模糊搜尋...`);
    const [allRows] = await conn.execute(
      "SELECT id, name, slug, imageUrl FROM products WHERE name LIKE ? LIMIT 5",
      [`%辣椒醬%`]
    );
    console.log(`   找到 ${allRows.length} 筆辣椒醬商品:`);
    allRows.forEach(r => console.log(`     id=${r.id}, name="${r.name}", slug="${r.slug}"`));
    return null;
  }

  const product = rows[0];
  console.log(`   找到商品: id=${product.id}, name="${product.name}"`);

  // 執行更新
  const [result] = await conn.execute(
    "UPDATE products SET imageUrl = ?, images = ?, updatedAt = NOW() WHERE id = ?",
    [imageUrl, imagesJson, product.id]
  );

  console.log(`   ✅ TiDB SQL 執行結果: Query OK, ${result.affectedRows} row(s) affected`);
  console.log(`   最終寫入的完整圖片網址: ${imageUrl}`);

  return { productId: product.id, affectedRows: result.affectedRows };
}

async function verifyTiDB(conn, productId, expectedUrl) {
  const [rows] = await conn.execute(
    "SELECT id, name, imageUrl, images FROM products WHERE id = ?",
    [productId]
  );
  if (rows.length > 0) {
    const p = rows[0];
    const match = p.imageUrl === expectedUrl;
    console.log(`\n🔍 驗證 TiDB 寫入結果:`);
    console.log(`   id: ${p.id}`);
    console.log(`   name: ${p.name}`);
    console.log(`   imageUrl: ${p.imageUrl}`);
    console.log(`   URL 比對: ${match ? "✅ 完全一致" : "❌ 不一致"}`);
    return match;
  }
  return false;
}

async function main() {
  console.log("=".repeat(60));
  console.log("  端對端測試：Cloudflare R2 上傳 + TiDB 寫入");
  console.log("=".repeat(60));

  // 連線 TiDB
  console.log("\n🔌 連線 TiDB Cloud...");
  const conn = await mysql.createConnection(TIDB_CONFIG);
  console.log("   ✅ TiDB 連線成功");

  const results = [];

  for (const img of IMAGES) {
    try {
      // 1. 上傳到 R2
      const { statusCode, publicUrl } = await uploadToR2(img.localPath, img.r2Key);

      // 2. 寫入 TiDB（imageUrl 和 images 欄位）
      const imagesJson = JSON.stringify([publicUrl]);
      const writeResult = await writeToTiDB(conn, img.productName, img.slug, publicUrl, imagesJson);

      if (writeResult) {
        // 3. 驗證
        await verifyTiDB(conn, writeResult.productId, publicUrl);
        results.push({ name: img.productName, url: publicUrl, success: true });
      }
    } catch (err) {
      console.error(`\n❌ 錯誤 (${img.productName}):`, err.message);
      results.push({ name: img.productName, error: err.message, success: false });
    }
  }

  await conn.end();

  console.log("\n" + "=".repeat(60));
  console.log("  最終摘要");
  console.log("=".repeat(60));
  results.forEach(r => {
    if (r.success) {
      console.log(`✅ ${r.name}`);
      console.log(`   URL: ${r.url}`);
    } else {
      console.log(`❌ ${r.name}: ${r.error}`);
    }
  });
  console.log("=".repeat(60));
}

main().catch(console.error);
