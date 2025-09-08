# Supabase Setup Guide for Mintari App

## 1. Prerequisites

- Node.js 18+ installed
- Supabase account
- Prisma CLI installed: `npm install -g prisma`

## 2. Supabase Project Setup

### Create New Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and enter project details:
   - Name: `mintari-app`
   - Database Password: Generate a strong password
   - Region: Choose closest to your users

### Get Connection Details
1. Go to Settings → Database
2. Copy the connection string
3. Go to Settings → API
4. Copy the Project URL and anon key

## 3. Environment Configuration

Create `.env.local` file:
```bash
cp env.example .env.local
```

Update with your Supabase credentials:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
```

## 4. Database Migration

### Install Dependencies
```bash
npm install prisma @prisma/client @supabase/supabase-js
```

### Generate Prisma Client
```bash
npx prisma generate
```

### Push Schema to Supabase
```bash
npx prisma db push
```

### Create Initial Migration (Optional)
```bash
npx prisma migrate dev --name init
```

## 5. Supabase Configuration

### Row Level Security (RLS)
Enable RLS on all tables and create policies:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_mintings ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id);

-- Uploads policies
CREATE POLICY "Users can manage own uploads" ON uploads
  FOR ALL USING (auth.uid()::text = user_id);

-- AI Generations policies
CREATE POLICY "Users can manage own generations" ON ai_generations
  FOR ALL USING (auth.uid()::text = user_id);

-- Generated Images policies
CREATE POLICY "Users can view own generated images" ON generated_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ai_generations 
      WHERE ai_generations.id = generated_images.generation_id 
      AND ai_generations.user_id = auth.uid()::text
    )
  );

-- Collections policies
CREATE POLICY "Users can manage own collections" ON collections
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Public collections are viewable" ON collections
  FOR SELECT USING (is_public = true);

-- Collection Items policies
CREATE POLICY "Users can manage own collection items" ON collection_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM collections 
      WHERE collections.id = collection_items.collection_id 
      AND collections.user_id = auth.uid()::text
    )
  );

-- NFT Mintings policies
CREATE POLICY "Users can manage own NFT mintings" ON nft_mintings
  FOR ALL USING (auth.uid()::text = user_id);

-- Physical Orders policies
CREATE POLICY "Users can manage own orders" ON physical_orders
  FOR ALL USING (auth.uid()::text = user_id);

-- Payment Methods policies
CREATE POLICY "Users can manage own payment methods" ON payment_methods
  FOR ALL USING (auth.uid()::text = user_id);

-- User Preferences policies
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid()::text = user_id);
```

### Storage Buckets
Create storage buckets for file uploads:

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('uploads', 'uploads', false),
  ('generated-images', 'generated-images', true),
  ('thumbnails', 'thumbnails', true);

-- Storage policies
CREATE POLICY "Users can upload own files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view generated images" ON storage.objects
  FOR SELECT USING (bucket_id IN ('generated-images', 'thumbnails'));
```

## 6. Authentication Setup

### Enable Authentication Providers
1. Go to Authentication → Settings
2. Enable Email provider
3. Configure OAuth providers (Google, GitHub, etc.) if needed

### Custom Claims (Optional)
Create a function to set custom user claims:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## 7. Database Functions

### Analytics Function
```sql
CREATE OR REPLACE FUNCTION public.track_event(
  event_type text,
  screen_name text DEFAULT NULL,
  event_data jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.app_analytics (
    user_id,
    event_type,
    screen_name,
    event_data,
    session_id,
    user_agent,
    ip_address
  ) VALUES (
    auth.uid()::text,
    event_type,
    screen_name,
    event_data,
    current_setting('request.jwt.claims', true)::json->>'session_id',
    current_setting('request.headers', true)::json->>'user-agent',
    inet_client_addr()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Image Processing Function
```sql
CREATE OR REPLACE FUNCTION public.process_upload(
  upload_id text,
  generation_type text DEFAULT 'ghibli'
)
RETURNS text AS $$
DECLARE
  generation_id text;
BEGIN
  -- Create AI generation record
  INSERT INTO public.ai_generations (
    user_id,
    upload_id,
    generation_type,
    generation_status
  ) VALUES (
    (SELECT user_id FROM uploads WHERE id = upload_id),
    upload_id,
    generation_type::generation_type,
    'PENDING'
  ) RETURNING id INTO generation_id;
  
  -- Update upload status
  UPDATE uploads SET upload_status = 'PROCESSING' WHERE id = upload_id;
  
  RETURN generation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 8. Indexes for Performance

```sql
-- User indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_wallet_address ON users(wallet_address);
CREATE INDEX CONCURRENTLY idx_users_created_at ON users(created_at);

-- Upload indexes
CREATE INDEX CONCURRENTLY idx_uploads_user_id ON uploads(user_id);
CREATE INDEX CONCURRENTLY idx_uploads_status ON uploads(upload_status);
CREATE INDEX CONCURRENTLY idx_uploads_created_at ON uploads(created_at);

-- Generation indexes
CREATE INDEX CONCURRENTLY idx_ai_generations_user_id ON ai_generations(user_id);
CREATE INDEX CONCURRENTLY idx_ai_generations_upload_id ON ai_generations(upload_id);
CREATE INDEX CONCURRENTLY idx_ai_generations_status ON ai_generations(generation_status);

-- Generated images indexes
CREATE INDEX CONCURRENTLY idx_generated_images_generation_id ON generated_images(generation_id);
CREATE INDEX CONCURRENTLY idx_generated_images_selected ON generated_images(is_selected);

-- Collection indexes
CREATE INDEX CONCURRENTLY idx_collections_user_id ON collections(user_id);
CREATE INDEX CONCURRENTLY idx_collections_public ON collections(is_public);

-- Collection items indexes
CREATE INDEX CONCURRENTLY idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX CONCURRENTLY idx_collection_items_favorite ON collection_items(is_favorite);
CREATE INDEX CONCURRENTLY idx_collection_items_created_at ON collection_items(created_at);

-- NFT minting indexes
CREATE INDEX CONCURRENTLY idx_nft_mintings_user_id ON nft_mintings(user_id);
CREATE INDEX CONCURRENTLY idx_nft_mintings_status ON nft_mintings(mint_status);
CREATE INDEX CONCURRENTLY idx_nft_mintings_token_id ON nft_mintings(token_id);

-- Physical orders indexes
CREATE INDEX CONCURRENTLY idx_physical_orders_user_id ON physical_orders(user_id);
CREATE INDEX CONCURRENTLY idx_physical_orders_status ON physical_orders(order_status);
CREATE INDEX CONCURRENTLY idx_physical_orders_created_at ON physical_orders(created_at);

-- Analytics indexes
CREATE INDEX CONCURRENTLY idx_analytics_user_id ON app_analytics(user_id);
CREATE INDEX CONCURRENTLY idx_analytics_event_type ON app_analytics(event_type);
CREATE INDEX CONCURRENTLY idx_analytics_created_at ON app_analytics(created_at);
```

## 9. Testing the Setup

### Test Database Connection
```bash
npx prisma db pull
npx prisma generate
```

### Test Supabase Client
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Test connection
const { data, error } = await supabase.from('users').select('*').limit(1)
console.log('Connection test:', { data, error })
```

## 10. Production Considerations

### Environment Variables
- Use different Supabase projects for development/staging/production
- Set up proper environment variable management
- Use Supabase CLI for local development

### Security
- Review and test all RLS policies
- Set up proper CORS settings
- Configure rate limiting
- Set up monitoring and alerts

### Performance
- Monitor query performance
- Set up connection pooling
- Configure proper indexes
- Use Supabase Edge Functions for heavy processing

### Backup & Recovery
- Enable automatic backups
- Test restore procedures
- Set up point-in-time recovery
- Document disaster recovery procedures
