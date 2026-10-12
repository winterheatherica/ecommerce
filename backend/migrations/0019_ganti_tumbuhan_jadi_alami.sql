UPDATE products
SET description = replace(description, 'berbahan dasar ekstrak tumbuhan', 'berbahan dasar alami')
WHERE description ILIKE '%tumbuhan%';
