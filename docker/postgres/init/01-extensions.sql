-- Extensions used across the learning lab.
-- Run automatically by the postgres image on first boot (fresh data volume).
CREATE EXTENSION IF NOT EXISTS pg_trgm;     -- trigram similarity, ILIKE optimisation
CREATE EXTENSION IF NOT EXISTS unaccent;    -- accent-insensitive full-text search
CREATE EXTENSION IF NOT EXISTS pgcrypto;    -- gen_random_uuid() helper
CREATE EXTENSION IF NOT EXISTS tablefunc;   -- crosstab() for pivot exercises
