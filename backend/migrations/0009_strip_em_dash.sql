UPDATE products
SET name = regexp_replace(name, '\s*' || U&'\2014' || '\s*', ' ', 'g')
WHERE position(U&'\2014' IN name) > 0;

UPDATE products
SET description = regexp_replace(description, '\s*' || U&'\2014' || '\s*', ', ', 'g')
WHERE position(U&'\2014' IN description) > 0;
