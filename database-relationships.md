# Mintari App Database Relationships

## Entity Relationship Diagram (Text-based)

```
┌─────────────────┐
│     USERS       │
├─────────────────┤
│ id (PK)         │
│ email           │
│ username        │
│ wallet_address  │
│ onboarding_completed │
└─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│   UPLOADS       │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ original_filename │
│ file_path       │
│ upload_status   │
└─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│ AI_GENERATIONS  │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ upload_id (FK)  │
│ generation_type │
│ generation_status │
│ progress_percentage │
└─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│GENERATED_IMAGES │
├─────────────────┤
│ id (PK)         │
│ generation_id (FK) │
│ image_url       │
│ is_selected     │
│ generation_variant │
└─────────────────┘
         │
         │ 1:1
         ▼
┌─────────────────┐
│  NFT_MINTINGS   │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ generated_image_id (FK) │
│ mint_status     │
│ token_id        │
│ transaction_hash │
└─────────────────┘

┌─────────────────┐
│  COLLECTIONS    │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ title           │
│ is_public       │
└─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│COLLECTION_ITEMS │
├─────────────────┤
│ id (PK)         │
│ collection_id (FK) │
│ upload_id (FK)  │
│ generated_image_id (FK) │
│ title           │
│ is_favorite     │
└─────────────────┘

┌─────────────────┐
│ PHYSICAL_ORDERS │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ generated_image_id (FK) │
│ order_status    │
│ frame_type      │
│ total_price     │
│ shipping_address │
└─────────────────┘

┌─────────────────┐
│ PAYMENT_METHODS │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ payment_type    │
│ last_four_digits │
│ is_default      │
└─────────────────┘

┌─────────────────┐
│USER_PREFERENCES │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ default_generation_style │
│ email_notifications │
│ theme_preference │
└─────────────────┘

┌─────────────────┐
│ APP_ANALYTICS   │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ event_type      │
│ screen_name     │
│ event_data      │
└─────────────────┘
```

## Data Flow Diagram

```
User Registration/Login
         │
         ▼
    Photo Upload ──────────┐
         │                 │
         ▼                 │
    AI Generation ─────────┤
         │                 │
         ▼                 │
   Generated Images ───────┤
         │                 │
         ▼                 │
    ┌─────────────┐        │
    │  Collection │        │
    │  (Save)     │        │
    └─────────────┘        │
         │                 │
         ▼                 │
    ┌─────────────┐        │
    │ NFT Minting │        │
    └─────────────┘        │
         │                 │
         ▼                 │
    ┌─────────────┐        │
    │Physical Order│       │
    └─────────────┘        │
         │                 │
         ▼                 │
    Payment Processing ────┘
```

## Key Business Rules

1. **One User** can have **Many Uploads**
2. **One Upload** can generate **Many AI Generations** (different styles)
3. **One AI Generation** can produce **Many Generated Images** (variants)
4. **One Generated Image** can be **Minted as NFT** (1:1 relationship)
5. **One Generated Image** can be **Ordered as Physical Frame** (1:N relationship)
6. **One User** can have **Many Collections**
7. **One Collection** can contain **Many Items**
8. **One Collection Item** references both **Original Upload** and **Generated Image**

## State Management

### Upload States
- `pending` → `processing` → `completed` / `failed`

### Generation States
- `pending` → `processing` → `completed` / `failed`

### NFT Minting States
- `pending` → `minting` → `completed` / `failed`

### Order States
- `pending` → `processing` → `shipped` → `delivered` / `cancelled`

## Performance Considerations

1. **Indexes** on frequently queried columns
2. **Partitioning** for large tables (analytics, uploads)
3. **Caching** for user preferences and system settings
4. **CDN** for image delivery
5. **Background jobs** for AI generation and NFT minting
6. **Queue system** for processing heavy operations
