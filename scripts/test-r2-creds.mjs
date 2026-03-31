import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const ACCOUNT_ID = "d4dbdd11c1db22961203972fd5c46b06";
const BUCKET = "ordersome-b2b";
const buf = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

async function testCreds(label, accessKeyId, secretAccessKey) {
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  try {
    const resp = await client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: `test/cred-test-${Date.now()}.png`,
      Body: buf,
      ContentType: "image/png",
      ContentLength: buf.length,
    }));
    console.log(`✅ [${label}] WORKS! HTTP ${resp.$metadata.httpStatusCode}`);
    return true;
  } catch (e) {
    console.log(`❌ [${label}] FAILED: ${e.message}`);
    return false;
  }
}

// Railway credentials (from screenshot)
await testCreds("Railway", "1dc7682bed5ed7bec4e69c6ccd85d415", "d1940a44b541e13199403553f7677c68867b9013a68990f1849e3fe113e90c37");

// Original script credentials
await testCreds("Original Script", "d1908a2d75c6af2adfccb1f587dc811a", "168b4fd65f3fe105dceb48e706724e08e10cad5f262fee05da936253c934db1a");
