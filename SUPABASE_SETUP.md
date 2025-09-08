# Supabase Database Setup Guide

## 🚀 Quick Start

Your Supabase connection details:
- **Project URL**: `https://mzmoxjueezoukioswfga.supabase.co`
- **Database URL**: `postgresql://postgres.mzmoxjueezoukioswfga:WFgTyBHJkrLmn5B5@aws-1-us-east-1.pooler.supabase.com:6543/postgres`
- **Pooler**: ✅ Enabled (recommended for production)

## 📋 Prerequisites

1. **Node.js 18+** installed
2. **Prisma CLI** installed: `npm install -g prisma`
3. **Supabase account** with project created

## 🔧 Step 1: Install Dependencies

```bash
# Install all required packages
npm install

# Install Prisma CLI globally (if not already installed)
npm install -g prisma
```

## 🔑 Step 2: Environment Configuration

Create `.env.local` file in your project root:

```bash
# Copy the example file
cp env.local.example .env.local
```

Update `.env.local` with your connection string:

```env
# Database Connection (Supabase Pooler)
DATABASE_URL="postgresql://postgres.mzmoxjueezoukioswfga:WFgTyBHJkrLmn5B5@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://mzmoxjueezoukioswfga.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[GET_FROM_SUPABASE_DASHBOARD]"
SUPABASE_SERVICE_ROLE_KEY="[GET_FROM_SUPABASE_DASHBOARD]"
```

### Get Supabase Keys:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `mzmoxjueezoukioswfga`
3. Go to **Settings** → **API**
4. Copy the **anon public** key and **service_role** key

## 🗄️ Step 3: Database Setup

### Option A: Automated Setup (Recommended)
```bash
# Run the complete setup script
node scripts/setup-database.js
```

### Option B: Manual Setup
```bash
# 1. Push Prisma schema to database
npx prisma db push

# 2. Generate Prisma client
npx prisma generate

# 3. Test connection
node scripts/test-connection.js
```

## 🌱 Step 4: Seed Database (Optional)

```bash
# Populate database with demo data
node scripts/seed-database.js
```

This will create:
- Demo user account
- Sample uploads and generations
- Example collections and items
- Demo NFT minting and orders
- Analytics data

## ✅ Step 5: Verify Setup

### Test Database Connection
```bash
node scripts/test-connection.js
```

Expected output:
```
🔄 Testing database connection...
✅ Database connection successful!
📊 Test query result: [ { test: 1 } ]
📋 Database Info: { database_name: 'postgres', current_user: 'postgres', ... }
```

### Test Prisma Client
```bash
npx prisma studio
```

This opens Prisma Studio in your browser where you can view and edit your data.

## 🔒 Step 6: Security Configuration

### Enable Row Level Security (RLS)

Run these SQL commands in your Supabase SQL Editor:

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

### Create Storage Buckets

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

## 🚀 Step 7: Start Development

```bash
# Start the development server
npm run dev
```

Your app will be available at `http://localhost:3000`

## 📊 Database Schema Overview

### Core Tables:
- **users** - User accounts and profiles
- **uploads** - Original photo uploads
- **ai_generations** - AI processing jobs
- **generated_images** - AI-generated results
- **collections** - User collections
- **collection_items** - Collection content
- **nft_mintings** - NFT minting records
- **physical_orders** - Frame orders
- **payment_methods** - Payment options
- **user_preferences** - App settings
- **app_analytics** - Usage tracking
- **system_settings** - App configuration

### Key Relationships:
- User → Uploads (1:N)
- Upload → AI Generations (1:N)
- AI Generation → Generated Images (1:N)
- Generated Image → NFT Minting (1:1)
- Generated Image → Physical Orders (1:N)
- User → Collections (1:N)
- Collection → Collection Items (1:N)

## 🔧 Available Scripts

```bash
# Database operations
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:migrate     # Create and run migrations
npm run db:studio      # Open Prisma Studio
npm run db:seed        # Seed database with demo data

# Custom scripts
node scripts/test-connection.js    # Test database connection
node scripts/setup-database.js     # Complete database setup
node scripts/seed-database.js      # Populate with demo data
```

## 🐛 Troubleshooting

### Connection Issues
```bash
# Test connection
node scripts/test-connection.js

# Check if Prisma client is generated
npx prisma generate

# Reset and push schema
npx prisma db push --force-reset
```

### Common Errors

1. **"Connection refused"**
   - Check if your IP is whitelisted in Supabase
   - Verify the connection string is correct

2. **"Schema not found"**
   - Run `npx prisma db push` to create tables
   - Check if you're using the correct database

3. **"Permission denied"**
   - Ensure RLS policies are set up correctly
   - Check if user is authenticated

### Reset Database
```bash
# Reset everything and start fresh
npx prisma db push --force-reset
node scripts/seed-database.js
```

## 📈 Performance Optimization

### Connection Pooling
Your connection string uses Supabase's pooler, which is optimized for:
- Multiple concurrent connections
- Reduced connection overhead
- Better resource utilization

### Indexes
The setup script automatically creates indexes for:
- User lookups
- Upload status queries
- Generation tracking
- Collection browsing
- Analytics queries

## 🔐 Security Best Practices

1. **Never commit** `.env.local` to version control
2. **Use RLS policies** for data access control
3. **Validate inputs** before database operations
4. **Use prepared statements** (Prisma handles this)
5. **Monitor** database access logs
6. **Regular backups** (Supabase handles this automatically)

## 📞 Support

If you encounter issues:
1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review [Prisma Documentation](https://www.prisma.io/docs)
3. Check the troubleshooting section above
4. Verify your connection string and credentials

## 🎉 You're Ready!

Your Mintari app is now connected to Supabase with:
- ✅ Database schema deployed
- ✅ Prisma client generated
- ✅ Security policies configured
- ✅ Demo data populated
- ✅ Development server ready

Happy coding! 🚀
