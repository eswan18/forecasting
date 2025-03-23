-- Michel Barnier was removed as PM of France before 2025 even began,
-- so we need to remove the relevant prop from the database.
DELETE FROM forecasts WHERE prop_id = 67;
DELETE FROM props WHERE id = 67;

-- The Kroger/Alberton's merger was rejected and Albertson's is already suing Kroger,
-- so this is off the board.
DELETE FROM forecasts WHERE prop_id = 64;
DELETE FROM props WHERE id = 64;

-- Jimmy Carter died before the end of 2024, so his 2025 prop is removed.
DELETE FROM forecasts WHERE prop_id = 65;
DELETE FROM props WHERE id = 65;

-- There were two props about Jerome Powell still being in his position at the end of
-- 2025 (47 & 70), so we need to remove the latter.
DELETE FROM forecasts WHERE prop_id = 70;
DELETE FROM props WHERE id = 70;