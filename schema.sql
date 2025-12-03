-- Our SQL schema.

-- Create our user, with login privileges,
-- but no superuser privileges.
DO $$
BEGIN
    CREATE ROLE capstone WITH
        LOGIN
        NOSUPERUSER
        NOCREATEDB
        NOCREATEROLE
        NOREPLICATION;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;

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

-- For labs, we store a unique ID, title, and markdown content
CREATE TABLE IF NOT EXISTS labs (
    uid TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    md TEXT NOT NULL
);

ALTER TABLE labs OWNER TO capstone;

-- Test cases for labs. Each lab can have many test cases.
-- seed_* columns define initial state, result_* columns define expected final state.
-- All JSON stored as TEXT for simplicity.
CREATE TABLE IF NOT EXISTS test_cases (
    uid TEXT PRIMARY KEY,
    lab_uid TEXT NOT NULL REFERENCES labs(uid) ON DELETE CASCADE,
    name TEXT NOT NULL,
    seed_registers TEXT NOT NULL DEFAULT '{}',
    seed_memory TEXT NOT NULL DEFAULT '{}',
    result_registers TEXT NOT NULL DEFAULT '{}',
    result_memory TEXT NOT NULL DEFAULT '{}'
);

ALTER TABLE test_cases OWNER TO capstone;
