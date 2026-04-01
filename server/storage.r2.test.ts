import { describe, it, expect, vi } from "vitest";

describe("R2 upload via storagePut", () => {
  it("should upload a small PNG buffer and return a public URL", async () => {
    // Set env vars before importing storage (vitest runs in same process)
    process.env.R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "d4dbdd11c1db22961203972fd5c46b06";
    process.env.R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "d1908a2d75c6af2adfccb1f587dc811a";
    process.env.R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "168b4fd65f3fe105dceb48e706724e08e10cad5f262fee05da936253c934db1a";
    process.env.R2_BUCKET = process.env.R2_BUCKET || "ordersome-b2b";
    process.env.R2_PUBLIC_URL_PREFIX = process.env.R2_PUBLIC_URL_PREFIX || "https://pub-344b4e8c0e374787a0dd2b2024ee46c6.r2.dev";

    // Dynamic import after env is set
    const { storagePut } = await import("./storage");

    const buf = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    const { url, key } = await storagePut(
      `test/vitest-storage-${Date.now()}.png`,
      buf,
      "image/png"
    );
    expect(url).toMatch(/^https:\/\//);
    expect(key).toMatch(/^test\/vitest-storage-/);
    console.log("[R2 test] uploaded:", url);
  });
});
