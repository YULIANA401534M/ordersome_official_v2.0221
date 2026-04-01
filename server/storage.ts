/**
 * Storage helpers — Cloudflare R2 (S3-compatible)
 *
 * Required environment variables (standard AWS SDK naming):
 *   R2_ACCOUNT_ID        — Cloudflare account ID
 *   R2_ACCESS_KEY_ID     — R2 API token access key
 *   R2_SECRET_ACCESS_KEY — R2 API token secret key
 *   R2_BUCKET            — bucket name (default: ordersome-b2b)
 *   R2_PUBLIC_URL_PREFIX — public CDN prefix
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID ?? "";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? "";
  const bucket = process.env.R2_BUCKET ?? "ordersome-b2b";
  const publicUrlPrefix =
    process.env.R2_PUBLIC_URL_PREFIX ??
    "https://pub-344b4e8c0e374787a0dd2b2024ee46c6.r2.dev";

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 credentials missing: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY"
    );
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrlPrefix };
}

let _client: S3Client | null = null;
function getClient(): S3Client {
  if (_client) return _client;
  const { accountId, accessKeyId, secretAccessKey } = getR2Config();
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _client;
}

/**
 * Upload bytes to R2 and return the public URL.
 * @param relKey      e.g. "products/123/thumb.jpg"
 * @param data        Buffer | Uint8Array | string
 * @param contentType MIME type (default: application/octet-stream)
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const { bucket, publicUrlPrefix } = getR2Config();
  const key = relKey.replace(/^\/+/, "");
  const body = typeof data === "string" ? Buffer.from(data) : (data as Buffer);

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentLength: body.length,
    })
  );

  const url = `${publicUrlPrefix.replace(/\/+$/, "")}/${key}`;
  return { key, url };
}

/**
 * Get the public URL for an object key.
 * (The bucket is public, so no presigning is needed.)
 */
export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const { publicUrlPrefix } = getR2Config();
  const key = relKey.replace(/^\/+/, "");
  const url = `${publicUrlPrefix.replace(/\/+$/, "")}/${key}`;
  return { key, url };
}
