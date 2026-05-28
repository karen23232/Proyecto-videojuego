-- Tabla de perfiles de usuario (extiende auth.users con username)
CREATE TABLE profiles (
id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
username VARCHAR(20) UNIQUE NOT NULL,
created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de comentarios
CREATE TABLE comments (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
author_name VARCHAR(40) NOT NULL,
rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para paginación cursor-based (por fecha descendente)
CREATE INDEX comments_pagination_idx ON comments (created_at DESC, id DESC);
