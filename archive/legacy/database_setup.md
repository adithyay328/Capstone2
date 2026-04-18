This is for mac, im sure its similar on windows:


1. Open ur postgress app or pgadmin, set up a server on 5432 (default) 
Open terminal and paste this whole thing:

psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'capstone') THEN
    CREATE ROLE capstone WITH LOGIN PASSWORD 'capstone';
  END IF;
END $$;

DROP DATABASE IF EXISTS capstone;
CREATE DATABASE capstone OWNER capstone;
SQL


------------------------------------
====================================


2. Then paste this:
psql -U postgres -d capstone -v ON_ERROR_STOP=1 <<'SQL'
ALTER SCHEMA public OWNER TO capstone;
GRANT ALL ON SCHEMA public TO capstone;
SQL

------------------------------------
====================================

3. Then in the capstone root folder paste this:
psql -U capstone -d capstone -f SQL_MIGRATION.sql

