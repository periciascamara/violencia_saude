-- ============================================
-- VERIDICUS I.A - Schema do Supabase v2
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

-- Tabela de Usuários (login por CPF)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cpf TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL DEFAULT '',
  telefone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  profissao TEXT DEFAULT '',
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Likes
CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  card_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Favoritos
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  card_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, card_id)
);

-- Tabela de Visitas (tracking de card flips)
CREATE TABLE visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Cliques em Documentos
CREATE TABLE document_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  document_name TEXT NOT NULL,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_clicks ENABLE ROW LEVEL SECURITY;

-- Users: leitura, inserção e atualização públicas
CREATE POLICY "allow_read_users" ON users FOR SELECT USING (true);
CREATE POLICY "allow_insert_users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_users" ON users FOR UPDATE USING (true);

-- Likes: leitura e inserção públicas
CREATE POLICY "allow_read_likes" ON likes FOR SELECT USING (true);
CREATE POLICY "allow_insert_likes" ON likes FOR INSERT WITH CHECK (true);

-- Favorites: CRUD público
CREATE POLICY "allow_read_favorites" ON favorites FOR SELECT USING (true);
CREATE POLICY "allow_insert_favorites" ON favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_delete_favorites" ON favorites FOR DELETE USING (true);

-- Visits: inserção e leitura públicas
CREATE POLICY "allow_insert_visits" ON visits FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_read_visits" ON visits FOR SELECT USING (true);

-- Document Clicks: inserção e leitura públicas
CREATE POLICY "allow_insert_clicks" ON document_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_read_clicks" ON document_clicks FOR SELECT USING (true);
