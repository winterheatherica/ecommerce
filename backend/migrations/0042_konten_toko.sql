CREATE TABLE store_settings (
  id                  boolean     PRIMARY KEY DEFAULT true CHECK (id),
  wa_number           text        NOT NULL CHECK (wa_number ~ '^62[1-9][0-9]{7,12}$'),
  wa_link             text        CHECK (wa_link ~ '^https://\S+$' AND length(wa_link) <= 300),
  address_street      text        NOT NULL CHECK (length(address_street) BETWEEN 3 AND 200),
  address_village     text        NOT NULL CHECK (length(address_village) BETWEEN 2 AND 80),
  address_district    text        NOT NULL CHECK (length(address_district) BETWEEN 2 AND 80),
  address_city        text        NOT NULL CHECK (length(address_city) BETWEEN 2 AND 80),
  address_province    text        NOT NULL CHECK (length(address_province) BETWEEN 2 AND 80),
  postal_code         text        NOT NULL CHECK (postal_code ~ '^[0-9]{5}$'),
  maps_url            text        CHECK (maps_url ~ '^https://\S+$' AND length(maps_url) <= 300),
  open_days           jsonb       NOT NULL CHECK (jsonb_typeof(open_days) = 'array'),
  opens_at            text        NOT NULL CHECK (opens_at ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  closes_at           text        NOT NULL CHECK (closes_at ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  closed_on_holidays  boolean     NOT NULL DEFAULT true,
  social_links        jsonb       NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(social_links) = 'array'),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CHECK (opens_at < closes_at)
);

CREATE TABLE category_groups (
  slug        text    PRIMARY KEY CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 40),
  label       text    NOT NULL CHECK (length(label) BETWEEN 2 AND 40),
  title       text    NOT NULL CHECK (length(title) BETWEEN 2 AND 80),
  summary     text    NOT NULL CHECK (length(summary) BETWEEN 10 AND 400),
  sort_order  integer NOT NULL DEFAULT 0
);

CREATE TABLE categories (
  slug        text    PRIMARY KEY CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 40),
  group_slug  text    NOT NULL REFERENCES category_groups (slug),
  label       text    NOT NULL CHECK (length(label) BETWEEN 2 AND 40),
  title       text    NOT NULL CHECK (length(title) BETWEEN 2 AND 80),
  seo_title   text    NOT NULL CHECK (length(seo_title) BETWEEN 2 AND 80),
  summary     text    NOT NULL CHECK (length(summary) BETWEEN 10 AND 400),
  complaint   text    CHECK (length(complaint) BETWEEN 3 AND 60),
  sort_order  integer NOT NULL DEFAULT 0
);

CREATE INDEX categories_group_idx ON categories (group_slug, sort_order);

CREATE TABLE faq_groups (
  slug        text    PRIMARY KEY CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 60),
  title       text    NOT NULL CHECK (length(title) BETWEEN 2 AND 80),
  sort_order  integer NOT NULL DEFAULT 0
);

CREATE TABLE faq_items (
  id          bigserial PRIMARY KEY,
  group_slug  text      NOT NULL REFERENCES faq_groups (slug) ON DELETE CASCADE,
  question    text      NOT NULL CHECK (length(question) BETWEEN 5 AND 300),
  answer      text      NOT NULL CHECK (length(answer) BETWEEN 2 AND 3000),
  sort_order  integer   NOT NULL DEFAULT 0
);

CREATE INDEX faq_items_group_idx ON faq_items (group_slug, sort_order);

ALTER TABLE store_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_groups      ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items       ENABLE ROW LEVEL SECURITY;
