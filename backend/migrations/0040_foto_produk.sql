ALTER TABLE product_images
  ADD COLUMN variant_id bigint REFERENCES product_variants (id) ON DELETE SET NULL,
  ADD COLUMN version bigint,
  ADD COLUMN width integer,
  ADD COLUMN height integer,
  ADD CONSTRAINT product_images_cloudinary_id CHECK (cloudinary_id ~ '^menik-store/produk/[A-Za-z0-9_-]{1,120}$'),
  ADD CONSTRAINT product_images_ukuran CHECK (
    (width IS NULL AND height IS NULL) OR (width > 0 AND height > 0)
  ),
  ADD CONSTRAINT product_images_unik UNIQUE (product_id, cloudinary_id);

CREATE INDEX product_images_variant_idx ON product_images (variant_id);
