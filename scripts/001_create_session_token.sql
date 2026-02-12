-- Migration: Create session_token table for persistent refresh/reset tokens
-- Replaces in-memory _refresh_tokens and _reset_tokens dicts

CREATE TABLE IF NOT EXISTS session_token (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    token_type VARCHAR(20) NOT NULL CHECK (token_type IN ('refresh', 'reset')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used BOOLEAN NOT NULL DEFAULT FALSE,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    email VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_session_token_token_hash ON session_token(token_hash);
CREATE INDEX IF NOT EXISTS idx_session_token_user_id ON session_token(user_id);
CREATE INDEX IF NOT EXISTS idx_session_token_type ON session_token(token_type);
CREATE INDEX IF NOT EXISTS idx_session_token_expires ON session_token(expires_at);
CREATE INDEX IF NOT EXISTS idx_session_token_used ON session_token(used);
