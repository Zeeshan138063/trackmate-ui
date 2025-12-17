-- Clean up manual schema creation if it exists (from failed attempt)
-- CASCADE is needed to remove any objects if they were created, though likely empty.
drop schema if exists "net" cascade;

-- Enable the extension (this will create the 'net' schema automatically)
create extension if not exists "pg_net";
