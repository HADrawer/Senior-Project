

BEGIN;

CREATE EXTENSION IF NOT EXISTS citext;

-- =========================
-- 1) ROLES
-- =========================
CREATE TABLE IF NOT EXISTS roles (
    id              SMALLSERIAL PRIMARY KEY,
    name            VARCHAR(30) NOT NULL UNIQUE
);

-- Seed basic roles
INSERT INTO roles (name)
VALUES ('admin'), ('user')
ON CONFLICT (name) DO NOTHING;

-- =========================
-- 2) USERS
-- =========================
CREATE TABLE IF NOT EXISTS users (
    id                  BIGSERIAL PRIMARY KEY,
    full_name           VARCHAR(150) NOT NULL,
    email               CITEXT NOT NULL UNIQUE,
    password_hash       TEXT NOT NULL,
    phone_number        VARCHAR(30) NOT NULL,
    role_id             SMALLINT NOT NULL REFERENCES roles(id),
    preferred_language  VARCHAR(5) NOT NULL DEFAULT 'en',
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_users_preferred_language
        CHECK (preferred_language IN ('en', 'ar'))
);

-- =========================
-- 3) USER SESSIONS
-- =========================
CREATE TABLE IF NOT EXISTS user_sessions (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token   TEXT NOT NULL UNIQUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL,
    last_used_at    TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    ip_address      INET,
    device_info     TEXT,

    CONSTRAINT chk_user_sessions_expiry
        CHECK (expires_at > created_at)
);

-- =========================
-- 4) PLACE CATEGORIES
-- =========================
CREATE TABLE IF NOT EXISTS place_categories (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(80) NOT NULL UNIQUE,
    description     TEXT
);

-- Example seed categories
INSERT INTO place_categories (name, description)
VALUES
    ('attraction', 'General tourist attraction'),
    ('restaurant', 'Restaurants and dining places'),
    ('cafe', 'Cafes and coffee shops'),
    ('activity', 'Activities and experiences'),
    ('beach', 'Beaches and seaside places'),
    ('shopping', 'Shopping destinations'),
    ('historical_site', 'Historical and heritage places'),
    ('museum', 'Museums and exhibitions')
ON CONFLICT (name) DO NOTHING;

-- =========================
-- 5) PLACES
-- =========================
CREATE TABLE IF NOT EXISTS places (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(200) NOT NULL,
    description         TEXT,
    category_id         BIGINT NOT NULL REFERENCES place_categories(id) ON DELETE RESTRICT,
    location            VARCHAR(255),
    average_cost        NUMERIC(10,2),
    opening_hours       TEXT,
    latitude            NUMERIC(9,6),
    longitude           NUMERIC(9,6),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_places_average_cost
        CHECK (average_cost IS NULL OR average_cost >= 0)
);

-- =========================
-- 6) PLACE SOURCES
-- =========================
CREATE TABLE IF NOT EXISTS place_sources (
    id              BIGSERIAL PRIMARY KEY,
    place_id        BIGINT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    source_name     VARCHAR(150) NOT NULL,
    source_url      TEXT NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- 7) PLANS
-- =========================
CREATE TABLE IF NOT EXISTS plans (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title               VARCHAR(200),
    budget              NUMERIC(10,2),
    days                INTEGER NOT NULL,
    preferences         TEXT,
    user_interests      TEXT,
    travel_styles       TEXT,
    category            VARCHAR(100),
    place               VARCHAR(200),
    plan_details_json   JSONB NOT NULL DEFAULT '{}'::jsonb,
    status              VARCHAR(20) NOT NULL DEFAULT 'saved',
    generated_by_ai     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_plans_days
        CHECK (days > 0),
    CONSTRAINT chk_plans_budget
        CHECK (budget IS NULL OR budget >= 0),
    CONSTRAINT chk_plans_status
        CHECK (status IN ('draft', 'saved', 'deleted'))
);

-- =========================
-- 8) CHAT SESSIONS
-- =========================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id         BIGINT REFERENCES plans(id) ON DELETE SET NULL,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    status          VARCHAR(20) NOT NULL DEFAULT 'active',

    CONSTRAINT chk_chat_sessions_status
        CHECK (status IN ('active', 'closed', 'archived')),
    CONSTRAINT chk_chat_sessions_time
        CHECK (ended_at IS NULL OR ended_at >= started_at)
);

-- =========================
-- 9) MESSAGES
-- =========================
CREATE TABLE IF NOT EXISTS messages (
    id              BIGSERIAL PRIMARY KEY,
    chat_session_id BIGINT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender_type     VARCHAR(20) NOT NULL,
    message_text    TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_messages_sender_type
        CHECK (sender_type IN ('user', 'assistant', 'system'))
);

-- =========================
-- 10) USAGE LOGS
-- =========================
CREATE TABLE IF NOT EXISTS usage_logs (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action_type     VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(100),
    entity_id       BIGINT,
    metadata_json   JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- INDEXES
-- =========================
CREATE INDEX IF NOT EXISTS idx_users_role_id
    ON users(role_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id
    ON user_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at
    ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_places_category_id
    ON places(category_id);

CREATE INDEX IF NOT EXISTS idx_places_active
    ON places(is_active);

CREATE INDEX IF NOT EXISTS idx_plans_user_id
    ON plans(user_id);

CREATE INDEX IF NOT EXISTS idx_plans_status
    ON plans(status);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id
    ON chat_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_plan_id
    ON chat_sessions(plan_id);

CREATE INDEX IF NOT EXISTS idx_messages_chat_session_id
    ON messages(chat_session_id);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id
    ON usage_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_usage_logs_action_type
    ON usage_logs(action_type);

-- Optional JSONB indexes for future querying
CREATE INDEX IF NOT EXISTS idx_plans_plan_details_json
    ON plans
    USING GIN (plan_details_json);

CREATE INDEX IF NOT EXISTS idx_usage_logs_metadata_json
    ON usage_logs
    USING GIN (metadata_json);

COMMIT;
