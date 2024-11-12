-- This script is for removing a legacy user record (which isn't linked to a login)
-- and repointing all the associated forecasts to the new user record.
-- Replace all instances of '2' with the legacy user ID (to delete) and
-- all instances of '19' with the new user ID.
update forecasts set user_id = 19 where user_id = 2;
delete from users where id = 2;
