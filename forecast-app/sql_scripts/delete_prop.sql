-- Michel Barnier was removed as PM of France before 2025 even began,
-- so we need to remove the relevant prop from the database.

DELETE FROM forecasts WHERE prop_id = 67;
DELETE FROM props WHERE id = 67;