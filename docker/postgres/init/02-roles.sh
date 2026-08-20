#!/bin/sh
# Create the read-only role used by the query console.
# Runs on first boot as the POSTGRES superuser. The password is templated from
# the SQL_LAB_READONLY_PASSWORD env var (docker compose passes it through).
set -eu

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- The read-only role the query console connects as.
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sql_lab_readonly') THEN
            CREATE ROLE sql_lab_readonly
                LOGIN PASSWORD '${SQL_LAB_READONLY_PASSWORD:-readonly}'
                CONNECTION LIMIT 20;
        END IF;
    END
    \$\$;

    -- Connection + schema usage only.
    GRANT CONNECT ON DATABASE "${POSTGRES_DB}" TO sql_lab_readonly;
    REVOKE CREATE ON SCHEMA public FROM PUBLIC;
    GRANT USAGE ON SCHEMA public TO sql_lab_readonly;

    -- Read existing tables (none yet on first boot, but harmless).
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO sql_lab_readonly;
    GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO sql_lab_readonly;

    -- Future tables created by the owner role are automatically readable.
    ALTER DEFAULT PRIVILEGES FOR ROLE "${POSTGRES_USER}"
        IN SCHEMA public
        GRANT SELECT ON TABLES TO sql_lab_readonly;
    ALTER DEFAULT PRIVILEGES FOR ROLE "${POSTGRES_USER}"
        IN SCHEMA public
        GRANT SELECT ON SEQUENCES TO sql_lab_readonly;

    -- Second layer of protection: per-role statement timeouts.
    -- The API also sets SET LOCAL statement_timeout per transaction.
    ALTER ROLE sql_lab_readonly SET statement_timeout = '10s';
    ALTER ROLE sql_lab_readonly SET idle_in_transaction_session_timeout = '10s';
    ALTER ROLE sql_lab_readonly SET log_min_duration_statement = '0';
EOSQL
