ALTER TABLE reviews
  ADD COLUMN author_name_raw text
    CHECK (author_name_raw IS NULL OR length(btrim(author_name_raw)) BETWEEN 1 AND 100);

UPDATE reviews r
SET author_name_raw = btrim(u.name)
FROM users u
WHERE r.source = 'web'
  AND r.user_id = u.id
  AND r.author_name_raw IS NULL
  AND length(btrim(u.name)) BETWEEN 1 AND 100;
