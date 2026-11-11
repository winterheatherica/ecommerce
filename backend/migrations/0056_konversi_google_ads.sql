ALTER TABLE store_settings
  ADD COLUMN google_ads_send_to text
    CONSTRAINT store_settings_google_ads_send_to CHECK (
      google_ads_send_to IS NULL OR google_ads_send_to ~ '^AW-[0-9]{6,15}/[A-Za-z0-9_-]{4,64}$'
    );
