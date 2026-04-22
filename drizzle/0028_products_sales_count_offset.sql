-- Migration 0028: Add salesCountOffset to products table
-- Allows admins to adjust the displayed sales count while preserving real sales data
ALTER TABLE products ADD COLUMN salesCountOffset INT NOT NULL DEFAULT 0;
