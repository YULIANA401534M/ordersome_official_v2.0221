-- Migration 0027: Add bannerImageUrl to products table
-- Banner image displayed in the product detail page introduction tab (full-width)
ALTER TABLE products ADD COLUMN bannerImageUrl VARCHAR(500) NULL;
