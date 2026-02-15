-- Renomear coluna "metadata" para "extra_metadata" nas tabelas email_log e notification
-- "metadata" e palavra reservada do SQLAlchemy e causa crash no deploy

ALTER TABLE email_log RENAME COLUMN metadata TO extra_metadata;
ALTER TABLE notification RENAME COLUMN metadata TO extra_metadata;
