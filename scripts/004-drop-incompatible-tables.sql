-- =====================================================
-- Script 004: Dropar tabelas incompativeis com os modelos Python
-- As tabelas criadas pelos scripts 001-003 usam UUIDs e nomes diferentes
-- dos modelos SQLModel do backend Python. Este script as remove.
-- As tabelas roadmap_* sao mantidas (usadas pelo frontend direto).
-- =====================================================

-- Dropar tabelas do script antigo (nomes errados para o Python)
DROP TABLE IF EXISTS download_logs CASCADE;
DROP TABLE IF EXISTS email_history CASCADE;
DROP TABLE IF EXISTS expiration_logs CASCADE;
DROP TABLE IF EXISTS file_upload_steps CASCADE;
DROP TABLE IF EXISTS file_upload_items CASCADE;
DROP TABLE IF EXISTS file_uploads CASCADE;
DROP TABLE IF EXISTS otp_codes CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Dropar funcao de trigger se existir
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
