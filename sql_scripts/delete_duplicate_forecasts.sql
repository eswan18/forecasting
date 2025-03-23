-- Some forecasts were recorded multiple times in the forecasts table.
-- This command deletes the duplicates.
WITH
    duplicates AS (
        SELECT
            array_agg (id) AS ids,
            prop_id,
            user_id,
            forecast
        FROM
            forecasts
        GROUP BY
            prop_id,
            user_id,
            forecast
        HAVING
            COUNT(*) > 1
    )
DELETE FROM forecasts
WHERE
    id IN (
        SELECT
            -- Delete all but the first id
            unnest (ids[2:])
        FROM
            duplicates
    );

-- This is the one forecast that was recorded multiple times, but with different forecast values. Not sure how.
DELETE FROM forecasts WHERE id = 454;