ALTER TABLE store_settings
  ADD COLUMN google_site_verifications jsonb NOT NULL DEFAULT '[]'::jsonb
    CONSTRAINT store_settings_verifikasi_google CHECK (
      CASE
        WHEN jsonb_typeof(google_site_verifications) = 'array' THEN
          jsonb_array_length(google_site_verifications) <= 5
          AND google_site_verifications::text ~ '^\[("[A-Za-z0-9_-]{10,100}"(, "[A-Za-z0-9_-]{10,100}")*)?\]$'
        ELSE false
      END
    );
