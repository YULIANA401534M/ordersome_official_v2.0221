/**
 * Vitest test: Cloudflare R2 upload via r2Put helper
 * Validates that R2 credentials are set and a real upload succeeds.
 */
import { describe, it, expect } from "vitest";
import { r2Put } from "./lib/r2";

describe("R2 upload", () => {
  it("should upload a small PNG buffer and return a public URL", async () => {
    // 1x1 transparent PNG (67 bytes)
    const pngBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const buffer = Buffer.from(pngBase64, "base64");
    const key = `test/vitest-${Date.now()}.png`;

    const result = await r2Put(key, buffer, "image/png");

    expect(result.url).toMatch(/^https:\/\//);
    expect(result.url).toContain(key);
    expect(result.key).toBe(key);
  }, 20_000);
});
