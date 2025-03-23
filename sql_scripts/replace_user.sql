-- This script is for removing a legacy user record (which isn't linked to a login)
-- and repointing all the associated forecasts to the new user record.
-- Replace all instances of '4' with the legacy user ID (to delete) and
-- all instances of '23' with the new user ID.
update forecasts set user_id = 23 where user_id = 4;
delete from users where id = 4;
