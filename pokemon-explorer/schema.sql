
-- =========================================
-- Pokémon Explorer Database
-- PostgreSQL / Supabase
-- =========================================

BEGIN;

-- 1. MEMBERS: บัญชีผู้ใช้งาน
CREATE TABLE members (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'member'
        CHECK (role IN ('member', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ป้องกันอีเมลซ้ำ แม้ตัวพิมพ์เล็ก/ใหญ่ต่างกัน
CREATE UNIQUE INDEX idx_members_email_unique
ON members (LOWER(email));


-- 2. POKEMON: ข้อมูลโปเกมอน
CREATE TABLE pokemon (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    api_name VARCHAR(100) NOT NULL UNIQUE,
    image_url TEXT,
    height INTEGER,
    weight INTEGER,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 3. TYPES: ประเภทของโปเกมอน
CREATE TABLE types (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);


-- 4. POKEMON_TYPES: ความสัมพันธ์โปเกมอนกับประเภท
CREATE TABLE pokemon_types (
    pokemon_id INTEGER NOT NULL,
    type_id BIGINT NOT NULL,

    PRIMARY KEY (pokemon_id, type_id),

    FOREIGN KEY (pokemon_id)
        REFERENCES pokemon(id) ON DELETE CASCADE,

    FOREIGN KEY (type_id)
        REFERENCES types(id) ON DELETE CASCADE
);


-- 5. FAVORITES: รายการโปเกมอนที่สมาชิกชอบ
CREATE TABLE favorites (
    member_id BIGINT NOT NULL,
    pokemon_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (member_id, pokemon_id),

    FOREIGN KEY (member_id)
        REFERENCES members(id) ON DELETE CASCADE,

    FOREIGN KEY (pokemon_id)
        REFERENCES pokemon(id) ON DELETE CASCADE
);


-- 6. REVIEWS: รีวิวโปเกมอน
CREATE TABLE reviews (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    member_id BIGINT NOT NULL,
    pokemon_id INTEGER NOT NULL,
    content TEXT NOT NULL
        CHECK (CHAR_LENGTH(TRIM(content)) >= 10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- สมาชิกหนึ่งคนรีวิวโปเกมอนตัวเดิมได้หนึ่งรายการ
    UNIQUE (member_id, pokemon_id),

    FOREIGN KEY (member_id)
        REFERENCES members(id) ON DELETE CASCADE,

    FOREIGN KEY (pokemon_id)
        REFERENCES pokemon(id) ON DELETE CASCADE
);


-- =========================================
-- INDEXES: เพิ่มประสิทธิภาพการค้นหา
-- =========================================

CREATE INDEX idx_pokemon_name
ON pokemon(name);

CREATE INDEX idx_pokemon_types_type
ON pokemon_types(type_id);

CREATE INDEX idx_favorites_pokemon
ON favorites(pokemon_id);

CREATE INDEX idx_reviews_pokemon
ON reviews(pokemon_id);

CREATE INDEX idx_reviews_member
ON reviews(member_id);


-- =========================================
-- SEED DATA: ประเภทโปเกมอนทั้ง 18 ประเภท
-- =========================================

INSERT INTO types (name) VALUES
('normal'),
('fire'),
('water'),
('electric'),
('grass'),
('ice'),
('fighting'),
('poison'),
('ground'),
('flying'),
('psychic'),
('bug'),
('rock'),
('ghost'),
('dragon'),
('dark'),
('steel'),
('fairy');

COMMIT;
