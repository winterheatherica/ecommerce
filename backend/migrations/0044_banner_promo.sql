CREATE TABLE promo_banners (
  id             bigserial   PRIMARY KEY,
  cloudinary_id  text        CHECK (cloudinary_id ~ '^menik-store/banner/[A-Za-z0-9_-]{1,120}$'),
  static_path    text        CHECK (static_path ~ '^/banner-promo/[a-z0-9-]{1,60}\.(webp|png|jpg)$'),
  version        bigint      CHECK (version > 0),
  width          integer,
  height         integer,
  alt            text        NOT NULL CHECK (length(alt) BETWEEN 3 AND 160),
  link           text        CHECK (link ~ '^(/([^/[:space:]][^[:space:]]*)?|https://[^[:space:]]+)$' AND length(link) <= 300),
  sort_order     integer     NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT promo_banners_satu_sumber CHECK ((cloudinary_id IS NULL) <> (static_path IS NULL)),
  CONSTRAINT promo_banners_ukuran CHECK ((width IS NULL AND height IS NULL) OR (width > 0 AND height > 0))
);

CREATE INDEX promo_banners_urut_idx ON promo_banners (sort_order, id);

ALTER TABLE promo_banners ENABLE ROW LEVEL SECURITY;
