const { PrismaClient } = require('@prisma/client')

// Database connection with pooler
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.mzmoxjueezoukioswfga:WFgTyBHJkrLmn5B5@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
    }
  }
})

async function setupDatabase() {
  try {
    console.log('🚀 Setting up Mintari database...')
    
    // 1. Push Prisma schema to database
    console.log('📋 Pushing Prisma schema to database...')
    const { execSync } = require('child_process')
    
    try {
      execSync('npx prisma db push --force-reset', { 
        stdio: 'inherit',
        env: {
          ...process.env,
          DATABASE_URL: "postgresql://postgres.mzmoxjueezoukioswfga:WFgTyBHJkrLmn5B5@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
        }
      })
      console.log('✅ Schema pushed successfully!')
    } catch (error) {
      console.error('❌ Schema push failed:', error.message)
      return
    }
    
    // 2. Generate Prisma client
    console.log('🔧 Generating Prisma client...')
    try {
      execSync('npx prisma generate', { stdio: 'inherit' })
      console.log('✅ Prisma client generated!')
    } catch (error) {
      console.error('❌ Prisma client generation failed:', error.message)
      return
    }
    
    // 3. Test connection with new client
    console.log('🔄 Testing connection with new client...')
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Connection test successful!')
    
    // 4. Create system settings
    console.log('⚙️ Creating system settings...')
    const systemSettings = [
      {
        settingKey: 'app_version',
        settingValue: { version: '1.0.0' },
        description: 'Current application version',
        isPublic: true
      },
      {
        settingKey: 'ai_generation_settings',
        settingValue: {
          maxConcurrentGenerations: 5,
          defaultStyle: 'ghibli',
          maxFileSize: 10485760, // 10MB
          supportedFormats: ['jpg', 'jpeg', 'png', 'webp']
        },
        description: 'AI generation configuration',
        isPublic: false
      },
      {
        settingKey: 'nft_settings',
        settingValue: {
          defaultMintPrice: 0.05,
          contractAddress: null,
          network: 'ethereum'
        },
        description: 'NFT minting configuration',
        isPublic: false
      },
      {
        settingKey: 'payment_settings',
        settingValue: {
          stripeEnabled: true,
          paypalEnabled: false,
          cryptoEnabled: true
        },
        description: 'Payment processing configuration',
        isPublic: false
      }
    ]
    
    for (const setting of systemSettings) {
      try {
        await prisma.systemSetting.upsert({
          where: { settingKey: setting.settingKey },
          update: setting,
          create: setting
        })
        console.log(`✅ Created/updated setting: ${setting.settingKey}`)
      } catch (error) {
        console.log(`⚠️ Setting ${setting.settingKey} already exists or failed:`, error.message)
      }
    }
    
    // 5. Create indexes for performance
    console.log('📊 Creating performance indexes...')
    const indexes = [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_wallet_address ON users(wallet_address)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_uploads_user_id ON uploads(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_uploads_status ON uploads(upload_status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_generations_user_id ON ai_generations(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_generations_status ON ai_generations(generation_status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generated_images_generation_id ON generated_images(generation_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collections_user_id ON collections(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collections_public ON collections(is_public)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nft_mintings_user_id ON nft_mintings(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_physical_orders_user_id ON physical_orders(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_user_id ON app_analytics(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_event_type ON app_analytics(event_type)'
    ]
    
    for (const indexQuery of indexes) {
      try {
        await prisma.$executeRawUnsafe(indexQuery)
        console.log(`✅ Created index: ${indexQuery.split(' ')[5]}`)
      } catch (error) {
        console.log(`⚠️ Index creation failed or already exists:`, error.message)
      }
    }
    
    // 6. Verify setup
    console.log('🔍 Verifying database setup...')
    const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    console.log(`📋 Total tables created: ${tableCount[0].count}`)
    
    const settingCount = await prisma.systemSetting.count()
    console.log(`⚙️ System settings created: ${settingCount}`)
    
    console.log('🎉 Database setup completed successfully!')
    console.log('📝 Next steps:')
    console.log('   1. Update your .env.local with the correct DATABASE_URL')
    console.log('   2. Get your Supabase anon key from the dashboard')
    console.log('   3. Run: npm run dev')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    console.error('🔍 Full error:', error)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Database connection closed')
  }
}

// Run the setup
setupDatabase()
