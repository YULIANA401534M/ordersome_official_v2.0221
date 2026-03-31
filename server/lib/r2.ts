/**
 * Cloudflare R2 upload helper (uses @aws-sdk/client-s3 with S3-compatible API)
 * Used as a replacement for Manus Forge storagePut, which is not available in Railway.
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { ENV } from "../_core/env";

let _client: S3Client | null = null;

function getR2Client(): S3Client {
  if (_client) return _client;
  if (!ENV.r2AccountId || !ENV.r2AccessKeyId || !ENV.r2SecretAccessKey) {
    throw new Error("R2 credentials missing: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
  }
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${ENV.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: ENV.r2AccessKeyId,
      secretAccessKey: ENV.r2SecretAccessKey,
    },
  });
  return _client;
}

/**
 * Upload a buffer to Cloudflare R2 and return the public URL.
 * @param key  R2 object key, e.g. "products/123-abc.jpg"
 * @param body Buffer or Uint8Array
 * @param contentType MIME type
 */
export async function r2Put(
  key: string,
  body: Buffer | Uint8Array,
  contentType = "image/jpeg"
): Promise<{ key: string; url: string }> {
  const client = getR2Client();
  const bucket = ENV.r2Bucket || "ordersome-b2b";
  const publicPrefix = (ENV.r2PublicUrlPrefix || "https://pub-344b4e8c0e374787a0dd2b2024ee46c6.r2.dev").replace(/\/$/, "");

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    ContentLength: body.length,
  });

  const resp = await client.send(command);
  const status = resp.$metadata.httpStatusCode ?? 0;
  if (status < 200 || status >= 300) {
    throw new Error(`R2 upload failed with HTTP ${status}`);
  }

  const url = `${publicPrefix}/${key}`;
  return { key, url };
}
