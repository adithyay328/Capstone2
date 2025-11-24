-- Our SQL schema.

-- Create our user, with login privileges,
-- but no superuser privileges.
CREATE ROLE capstone WITH
    LOGIN
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE
    NOREPLICATION;

-- Set password for our user.
ALTER ROLE capstone WITH PASSWORD 'capstone';

-- First off, as an anti-pattern, we store secrets
-- directly in here, but not passwords. This is the sha
-- hash for our HMAC

CREATE TABLE IF NOT EXISTS secrets (
    name TEXT PRIMARY KEY,
    value TEXT NOT NULL 
);

ALTER TABLE secrets OWNER TO capstone;

-- For users, they are stored with their
-- username, a massive salt, and their password hash(argon2id)
CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    instructor BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE users OWNER TO capstone;