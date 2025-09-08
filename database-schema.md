# Mintari App Database Schema

## Overview
This document outlines the complete database schema for the Mintari App, a Ghibli-style photo transformation and NFT minting platform.

## Core Entities

### 1. Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    wallet_address VARCHAR(255) UNIQUE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);
```

### 2. User Sessions Table
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    device_info JSONB,
    ip_address INET
);
```

### 3. Uploads Table
```sql
CREATE TABLE uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    image_width INTEGER,
    image_height INTEGER,
    upload_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. AI Generations Table
```sql
CREATE TABLE ai_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
    generation_type VARCHAR(50) DEFAULT 'ghibli', -- ghibli, studio_ghibli, custom_style
    prompt TEXT,
    generation_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    progress_percentage INTEGER DEFAULT 0,
    error_message TEXT,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Generated Images Table
```sql
CREATE TABLE generated_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generation_id UUID REFERENCES ai_generations(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    image_width INTEGER,
    image_height INTEGER,
    file_size BIGINT,
    generation_variant INTEGER DEFAULT 1, -- 1, 2, 3, etc. for multiple variants
    is_selected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6. Collections Table
```sql
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. Collection Items Table
```sql
CREATE TABLE collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
    generated_image_id UUID REFERENCES generated_images(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    tags TEXT[], -- Array of tags
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 8. NFT Minting Table
```sql
CREATE TABLE nft_mintings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    generated_image_id UUID REFERENCES generated_images(id) ON DELETE CASCADE,
    collection_item_id UUID REFERENCES collection_items(id) ON DELETE CASCADE,
    mint_status VARCHAR(50) DEFAULT 'pending', -- pending, minting, completed, failed
    token_id VARCHAR(255), -- Blockchain token ID
    contract_address VARCHAR(255), -- Smart contract address
    transaction_hash VARCHAR(255), -- Blockchain transaction hash
    gas_fee DECIMAL(18, 8), -- Gas fee in ETH
    mint_price DECIMAL(18, 8), -- Mint price in ETH
    wallet_address VARCHAR(255), -- User's wallet address used for minting
    metadata_url TEXT, -- IPFS or other metadata URL
    error_message TEXT,
    minted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 9. Physical Orders Table
```sql
CREATE TABLE physical_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    generated_image_id UUID REFERENCES generated_images(id) ON DELETE CASCADE,
    collection_item_id UUID REFERENCES collection_items(id) ON DELETE CASCADE,
    order_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
    frame_type VARCHAR(100) NOT NULL, -- premium_wood, metal, etc.
    frame_size VARCHAR(50) NOT NULL, -- 12x16, 8x10, etc.
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    shipping_address JSONB NOT NULL, -- Full address object
    payment_method_id UUID, -- Reference to payment methods
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded
    tracking_number VARCHAR(255),
    estimated_delivery DATE,
    actual_delivery DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 10. Payment Methods Table
```sql
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    payment_type VARCHAR(50) NOT NULL, -- credit_card, paypal, crypto_wallet
    provider VARCHAR(100), -- stripe, paypal, etc.
    last_four_digits VARCHAR(4), -- For credit cards
    card_brand VARCHAR(50), -- visa, mastercard, etc.
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    encrypted_details JSONB, -- Encrypted payment details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 11. User Preferences Table
```sql
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    default_generation_style VARCHAR(50) DEFAULT 'ghibli',
    auto_save_to_collection BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    theme_preference VARCHAR(20) DEFAULT 'light', -- light, dark, auto
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 12. App Analytics Table
```sql
CREATE TABLE app_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL, -- screen_view, button_click, generation_started, etc.
    screen_name VARCHAR(100),
    event_data JSONB, -- Additional event-specific data
    session_id VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 13. System Settings Table
```sql
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- Whether this setting can be accessed by frontend
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Indexes for Performance

```sql
-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Session indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Upload indexes
CREATE INDEX idx_uploads_user_id ON uploads(user_id);
CREATE INDEX idx_uploads_status ON uploads(upload_status);
CREATE INDEX idx_uploads_created_at ON uploads(created_at);

-- Generation indexes
CREATE INDEX idx_ai_generations_user_id ON ai_generations(user_id);
CREATE INDEX idx_ai_generations_upload_id ON ai_generations(upload_id);
CREATE INDEX idx_ai_generations_status ON ai_generations(generation_status);

-- Generated images indexes
CREATE INDEX idx_generated_images_generation_id ON generated_images(generation_id);
CREATE INDEX idx_generated_images_selected ON generated_images(is_selected);

-- Collection indexes
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collections_public ON collections(is_public);

-- Collection items indexes
CREATE INDEX idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX idx_collection_items_favorite ON collection_items(is_favorite);
CREATE INDEX idx_collection_items_created_at ON collection_items(created_at);

-- NFT minting indexes
CREATE INDEX idx_nft_mintings_user_id ON nft_mintings(user_id);
CREATE INDEX idx_nft_mintings_status ON nft_mintings(mint_status);
CREATE INDEX idx_nft_mintings_token_id ON nft_mintings(token_id);

-- Physical orders indexes
CREATE INDEX idx_physical_orders_user_id ON physical_orders(user_id);
CREATE INDEX idx_physical_orders_status ON physical_orders(order_status);
CREATE INDEX idx_physical_orders_created_at ON physical_orders(created_at);

-- Analytics indexes
CREATE INDEX idx_analytics_user_id ON app_analytics(user_id);
CREATE INDEX idx_analytics_event_type ON app_analytics(event_type);
CREATE INDEX idx_analytics_created_at ON app_analytics(created_at);
```

## Key Relationships

1. **User → Uploads**: One-to-Many (User can have multiple uploads)
2. **Upload → AI Generations**: One-to-Many (One upload can generate multiple AI variations)
3. **AI Generation → Generated Images**: One-to-Many (One generation can produce multiple image variants)
4. **User → Collections**: One-to-Many (User can have multiple collections)
5. **Collection → Collection Items**: One-to-Many (Collection contains multiple items)
6. **Generated Image → NFT Minting**: One-to-One (Each generated image can be minted as NFT)
7. **Generated Image → Physical Orders**: One-to-Many (Same image can be ordered multiple times)
8. **User → Payment Methods**: One-to-Many (User can have multiple payment methods)

## Data Flow Summary

1. **User Registration/Login** → `users`, `user_sessions`
2. **Photo Upload** → `uploads`
3. **AI Generation** → `ai_generations`, `generated_images`
4. **Save to Collection** → `collections`, `collection_items`
5. **NFT Minting** → `nft_mintings`
6. **Physical Frame Order** → `physical_orders`, `payment_methods`
7. **User Preferences** → `user_preferences`
8. **Analytics Tracking** → `app_analytics`

## Additional Considerations

### File Storage
- Original uploads: Store in cloud storage (AWS S3, Google Cloud Storage)
- Generated images: Store in cloud storage with CDN
- Thumbnails: Generate and store multiple sizes
- Metadata: Store image metadata (EXIF, dimensions, etc.)

### Security
- Encrypt sensitive data (payment methods, personal info)
- Use UUIDs for all primary keys
- Implement proper access controls
- Audit logging for sensitive operations

### Scalability
- Consider partitioning for large tables (analytics, uploads)
- Implement caching for frequently accessed data
- Use read replicas for analytics queries
- Consider microservices architecture for different domains

### Compliance
- GDPR compliance for user data
- PCI compliance for payment data
- Data retention policies
- Right to be forgotten implementation
