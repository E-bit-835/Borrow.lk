-- BorrowLK PostgreSQL Relational Database Schema
-- Optimized for NeonDB

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'usr_' || replace(uuid_generate_v4()::text, '-', ''),
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(120),
    last_name VARCHAR(120),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'provider', 'admin')),
    district VARCHAR(100),
    city VARCHAR(100),
    address TEXT,
    avatar TEXT,
    dob VARCHAR(50),
    business_name VARCHAR(255),
    verification_status VARCHAR(50) DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'pending', 'unverified')),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    nic_verified BOOLEAN DEFAULT FALSE,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    reviews_count INT DEFAULT 0,
    rentals_count INT DEFAULT 0,
    member_since VARCHAR(100) DEFAULT to_char(NOW(), 'Month YYYY'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Clients Table (Clients / Customers managed by providers or users)
CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'cli_' || replace(uuid_generate_v4()::text, '-', ''),
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    company VARCHAR(255),
    district VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT,
    avatar TEXT,
    nic_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    client_type VARCHAR(50) DEFAULT 'individual' CHECK (client_type IN ('individual', 'corporate', 'agency')),
    total_rentals INT DEFAULT 0,
    total_spent NUMERIC(12, 2) DEFAULT 0.00,
    trust_score NUMERIC(3, 2) DEFAULT 5.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    icon_name VARCHAR(100) DEFAULT 'Layers',
    count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Clothing / Product Types Table
CREATE TABLE IF NOT EXISTS clothing_types (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'ct_' || replace(uuid_generate_v4()::text, '-', ''),
    category_id VARCHAR(100) REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    gender VARCHAR(50) DEFAULT 'unisex' CHECK (gender IN ('male', 'female', 'unisex', 'kids')),
    size_chart JSONB DEFAULT '["XS", "S", "M", "L", "XL", "XXL", "Free Size"]'::jsonb,
    base_deposit_rate NUMERIC(5, 2) DEFAULT 20.00, -- percentage
    inspection_criteria JSONB DEFAULT '["Fabric integrity", "Stain check", "Zipper/Button condition", "Dry cleaning tag"]'::jsonb,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Products / Listings Table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'prod_' || replace(uuid_generate_v4()::text, '-', ''),
    provider_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    category_slug VARCHAR(100) NOT NULL,
    clothing_type_id VARCHAR(100) REFERENCES clothing_types(id) ON DELETE SET NULL,
    images JSONB DEFAULT '[]'::jsonb,
    price_per_day NUMERIC(10, 2) NOT NULL,
    deposit NUMERIC(10, 2) DEFAULT 0.00,
    location VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    reviews_count INT DEFAULT 0,
    available_now BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    is_recent BOOLEAN DEFAULT TRUE,
    featured_badge VARCHAR(100),
    description TEXT NOT NULL,
    specifications JSONB DEFAULT '{}'::jsonb,
    included_items JSONB DEFAULT '[]'::jsonb,
    rental_terms JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived', 'paused')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Predictions Table (Dual Prediction Engine: Open-Source AI vs Custom ML)
CREATE TABLE IF NOT EXISTS predictions (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'pred_' || replace(uuid_generate_v4()::text, '-', ''),
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    client_id VARCHAR(100) REFERENCES clients(id) ON DELETE SET NULL,
    product_id VARCHAR(100) REFERENCES products(id) ON DELETE SET NULL,
    prediction_method VARCHAR(50) NOT NULL CHECK (prediction_method IN ('OPEN_SOURCE_AI', 'CUSTOM_ML', 'GEMINI_AI')),
    model_name VARCHAR(255) NOT NULL,
    model_version VARCHAR(100) NOT NULL,
    input_data JSONB NOT NULL,
    input_image_url TEXT,
    prediction_result JSONB NOT NULL,
    confidence_score NUMERIC(5, 4) NOT NULL,
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Orders / Bookings Table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'ord_' || replace(uuid_generate_v4()::text, '-', ''),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL, -- Customer
    client_id VARCHAR(100) REFERENCES clients(id) ON DELETE SET NULL, -- Associated client
    provider_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL, -- Provider
    product_id VARCHAR(100) REFERENCES products(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days INT NOT NULL CHECK (days > 0),
    daily_rate NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    deposit NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
    prediction_method VARCHAR(50) CHECK (prediction_method IN ('OPEN_SOURCE_AI', 'CUSTOM_ML', 'GEMINI_AI')),
    prediction_id VARCHAR(100) REFERENCES predictions(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Uploaded Files Table
CREATE TABLE IF NOT EXISTS uploaded_files (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'file_' || replace(uuid_generate_v4()::text, '-', ''),
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    file_url TEXT NOT NULL,
    storage_type VARCHAR(50) DEFAULT 'local',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'rev_' || replace(uuid_generate_v4()::text, '-', ''),
    product_id VARCHAR(100) REFERENCES products(id) ON DELETE CASCADE,
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(255) NOT NULL,
    author_avatar TEXT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Conversations & Messages
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'conv_' || replace(uuid_generate_v4()::text, '-', ''),
    user1_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    user2_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    listing_id VARCHAR(100) REFERENCES products(id) ON DELETE SET NULL,
    last_message TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'msg_' || replace(uuid_generate_v4()::text, '-', ''),
    conversation_id VARCHAR(100) REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    receiver_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'notif_' || replace(uuid_generate_v4()::text, '-', ''),
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('bookings', 'payments', 'messages', 'system', 'predictions')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    action_label VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'act_' || replace(uuid_generate_v4()::text, '-', ''),
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Email OTPs (email verification & password reset codes)
CREATE TABLE IF NOT EXISTS email_otps (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Upgrades for databases created from an earlier version of this schema
ALTER TABLE email_otps ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0;

ALTER TABLE predictions DROP CONSTRAINT IF EXISTS predictions_prediction_method_check;
ALTER TABLE predictions ADD CONSTRAINT predictions_prediction_method_check
    CHECK (prediction_method IN ('OPEN_SOURCE_AI', 'CUSTOM_ML', 'GEMINI_AI'));

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_prediction_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_prediction_method_check
    CHECK (prediction_method IN ('OPEN_SOURCE_AI', 'CUSTOM_ML', 'GEMINI_AI'));

-- One account, many capabilities: every user is a renter; HOST / PROVIDER are added to the same account
ALTER TABLE users ADD COLUMN IF NOT EXISTS host_status VARCHAR(20) NOT NULL DEFAULT 'none';
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_status VARCHAR(20) NOT NULL DEFAULT 'none';
ALTER TABLE users ADD COLUMN IF NOT EXISTS host_profile JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_profile JSONB;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_host_status_check;
ALTER TABLE users ADD CONSTRAINT users_host_status_check
    CHECK (host_status IN ('none', 'pending', 'approved', 'rejected'));

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_provider_status_check;
ALTER TABLE users ADD CONSTRAINT users_provider_status_check
    CHECK (provider_status IN ('none', 'pending', 'approved', 'rejected'));

-- Rental listings belong to hosts, service listings to providers
ALTER TABLE products ADD COLUMN IF NOT EXISTS listing_type VARCHAR(20) NOT NULL DEFAULT 'rental';
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_listing_type_check;
ALTER TABLE products ADD CONSTRAINT products_listing_type_check
    CHECK (listing_type IN ('rental', 'service'));

-- Listings: subcategory, how the price is charged, and province for Sri Lanka-wide search
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS province VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_unit VARCHAR(20) NOT NULL DEFAULT 'day';
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_price_unit_check;
ALTER TABLE products ADD CONSTRAINT products_price_unit_check
    CHECK (price_unit IN ('hour', 'day', 'night', 'week', 'month', 'service', 'quote'));

-- Rental / service requests: quantity, and the host or provider can reject
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 1;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled', 'rejected'));

-- Admins can suspend an account (blocks login and protected actions)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE;

-- Days a host / provider has marked a listing as unavailable
CREATE TABLE IF NOT EXISTS listing_blocked_dates (
    product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    blocked_date DATE NOT NULL,
    PRIMARY KEY (product_id, blocked_date)
);

-- Listings a customer has saved
CREATE TABLE IF NOT EXISTS wishlist_items (
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, product_id)
);

-- Plans hosts and providers can buy to publish more listings (customers never pay)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT '',
    price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    duration_days INT NOT NULL DEFAULT 30 CHECK (duration_days > 0),
    listing_limit INT NOT NULL DEFAULT 5 CHECK (listing_limit >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    -- The plan every host has when they have not bought one
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 99,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO subscription_plans (id, name, description, price, duration_days, listing_limit, is_default, sort_order) VALUES
    ('plan_free', 'Free', 'Get started with a few listings.', 0, 30, 5, TRUE, 0),
    ('plan_basic', 'Basic', 'For regular hosts and providers.', 1500, 30, 15, FALSE, 1),
    ('plan_standard', 'Standard', 'For growing rental businesses.', 3500, 30, 40, FALSE, 2),
    ('plan_premium', 'Premium', 'For large catalogues.', 7500, 30, 150, FALSE, 3)
ON CONFLICT (id) DO NOTHING;

-- One current subscription per account
CREATE TABLE IF NOT EXISTS subscriptions (
    user_id VARCHAR(100) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    plan_id VARCHAR(100) NOT NULL REFERENCES subscription_plans(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Payments submitted by hosts for a plan, confirmed by an administrator
CREATE TABLE IF NOT EXISTS subscription_payments (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'pay_' || replace(uuid_generate_v4()::text, '-', ''),
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    plan_id VARCHAR(100) REFERENCES subscription_plans(id) ON DELETE SET NULL,
    plan_name VARCHAR(100) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    method VARCHAR(50) NOT NULL,
    reference VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_provider_id ON products(provider_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_provider_id ON orders(provider_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_predictions_client_id ON predictions(client_id);
CREATE INDEX IF NOT EXISTS idx_predictions_method ON predictions(prediction_method);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);
