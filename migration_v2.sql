-- ============================================
-- MIGRAÇÃO v2 — Cadastro Expandido + Admin
-- Execute APENAS se já criou as tabelas anteriores
-- ============================================

-- Adicionar colunas ao users
ALTER TABLE users ADD COLUMN IF NOT EXISTS nome TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS telefone TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profissao TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Remover constraint UNIQUE de likes (se existir da versão anterior)
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_user_id_card_id_key;

-- Adicionar policy de UPDATE em users (para toggle admin)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_update_users' AND tablename = 'users') THEN
    CREATE POLICY "allow_update_users" ON users FOR UPDATE USING (true);
  END IF;
END $$;

-- PARA CRIAR O PRIMEIRO ADMINISTRADOR, execute:
-- UPDATE users SET is_admin = true WHERE cpf = 'SEU_CPF_AQUI';
