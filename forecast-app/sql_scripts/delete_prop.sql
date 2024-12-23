-- Michel Barnier was removed as PM of France before 2025 even began,
-- so we need to remove the relevant prop from the database.

DELETE FROM forecasts WHERE prop_id = 67;
DELETE FROM props WHERE id = 67;

-- The Kroger/Alberton's merger was rejected and Albertson's is already suing Kroger,
-- so this is off the board.
DELETE FROM forecasts WHERE prop_id = 64;
DELETE FROM props WHERE id = 64;