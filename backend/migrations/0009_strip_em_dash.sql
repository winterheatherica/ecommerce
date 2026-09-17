UPDATE products
SET name = regexp_replace(name, '\s*—\s*', ' ', 'g')
WHERE name LIKE '%' || U&'\2014' || '%';

UPDATE products
SET description = regexp_replace(description, '\s*—\s*', ', ', 'g')
WHERE description LIKE '%' || U&'\2014' || '%';
