ALTER TABLE product_variants
  ADD COLUMN package_weight_g integer,
  ADD COLUMN package_length_cm integer,
  ADD COLUMN package_width_cm integer,
  ADD COLUMN package_height_cm integer,
  ADD CONSTRAINT product_variants_paket_positif CHECK (
    coalesce(package_weight_g, 1) > 0
    AND coalesce(package_length_cm, 1) > 0
    AND coalesce(package_width_cm, 1) > 0
    AND coalesce(package_height_cm, 1) > 0
  ),
  ADD CONSTRAINT product_variants_dimensi_lengkap CHECK (
    num_nulls(package_length_cm, package_width_cm, package_height_cm) IN (0, 3)
  );

UPDATE product_variants
SET package_weight_g = 400, package_length_cm = 7, package_width_cm = 7, package_height_cm = 22
WHERE package_weight_g IS NULL AND label ~* '^ *(220|250) *ml *$';

UPDATE product_variants
SET package_weight_g = 150, package_length_cm = 18, package_width_cm = 8, package_height_cm = 6
WHERE package_weight_g IS NULL AND weight_g BETWEEN 70 AND 100;

UPDATE product_variants
SET package_weight_g = 400, package_length_cm = 10, package_width_cm = 10, package_height_cm = 22
WHERE package_weight_g IS NULL AND weight_g > 100 AND weight_g <= 250;
