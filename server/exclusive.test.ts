import { describe, it, expect } from "vitest";
import { getDb, getActiveProducts, getProductByExclusiveSlug } from "./db";

describe("B2B Exclusive Product Module", () => {
  it("should have isHidden, exclusiveSlug, exclusiveImageUrl columns in products table", async () => {
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    const columns = await db.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'products' 
       AND COLUMN_NAME IN ('isHidden', 'exclusiveSlug', 'exclusiveImageUrl')
       ORDER BY COLUMN_NAME`
    );

    const rows = (columns as any)[0] || columns;
    expect(rows.length).toBe(3);

    const colNames = rows.map((c: any) => c.COLUMN_NAME);
    expect(colNames).toContain("isHidden");
    expect(colNames).toContain("exclusiveSlug");
    expect(colNames).toContain("exclusiveImageUrl");
  });

  it("getActiveProducts should exclude hidden products by default", async () => {
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    const testSlug = `test-hidden-${Date.now()}`;
    await db.execute(
      `INSERT INTO products (name, slug, price, categoryId, stock, isActive, isHidden, exclusiveSlug) 
       VALUES ('Test Hidden', '${testSlug}', 100, 1, 10, 1, 1, 'exclusive-${testSlug}')`
    );

    try {
      const products = await getActiveProducts();
      const found = products.find((p: any) => p.slug === testSlug);
      expect(found).toBeUndefined();
    } finally {
      await db.execute(`DELETE FROM products WHERE slug = '${testSlug}'`);
    }
  });

  it("getProductByExclusiveSlug should return hidden product by slug", async () => {
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    const testSlug = `test-exclusive-${Date.now()}`;
    const exclusiveSlug = `b2b-${testSlug}`;
    await db.execute(
      `INSERT INTO products (name, slug, price, categoryId, stock, isActive, isHidden, exclusiveSlug, exclusiveImageUrl) 
       VALUES ('B2B Test', '${testSlug}', 299, 1, 50, 1, 1, '${exclusiveSlug}', 'https://example.com/long-image.jpg')`
    );

    try {
      const product = await getProductByExclusiveSlug(exclusiveSlug);
      expect(product).toBeDefined();
      expect((product as any).exclusiveSlug).toBe(exclusiveSlug);
      expect((product as any).exclusiveImageUrl).toBe("https://example.com/long-image.jpg");
    } finally {
      await db.execute(`DELETE FROM products WHERE slug = '${testSlug}'`);
    }
  });

  it("getProductByExclusiveSlug should return undefined for non-existent slug", async () => {
    const product = await getProductByExclusiveSlug("non-existent-slug-12345");
    expect(product).toBeUndefined();
  });
});
