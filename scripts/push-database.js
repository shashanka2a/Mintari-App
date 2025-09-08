const { PrismaClient } = require('@prisma/client')
const { execSync } = require('child_process')

// Database connection with SSL and proper Supabase configuration
const DATABASE_URL = "postgresql://postgres.mzmoxjueezoukioswfga:WFgTyBHJkrLmn5B5@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"

async function pushDatabase() {
  try {
    console.log('🚀 Pushing Mintari database schema to Supabase...')
    console.log('🔗 Using connection pooler with SSL...')
    
    // Set environment variable for Prisma
    process.env.DATABASE_URL = DATABASE_URL
    
    // 1. Test connection first
    console.log('🔄 Testing database connection...')
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: DATABASE_URL
        }
      }
    })
    
    try {
      const result = await prisma.$queryRaw`SELECT 1 as test`
      console.log('✅ Database connection successful!')
      console.log('📊 Connection test result:', result[0])
    } catch (error) {
      console.error('❌ Database connection failed:', error.message)
      throw error
    } finally {
      await prisma.$disconnect()
    }
    
    // 2. Push Prisma schema to database
    console.log('📋 Pushing Prisma schema to database...')
    try {
      execSync('npx prisma db push --force-reset', { 
        stdio: 'inherit',
        env: {
          ...process.env,
          DATABASE_URL: DATABASE_URL
        }
      })
      console.log('✅ Schema pushed successfully!')
    } catch (error) {
      console.error('❌ Schema push failed:', error.message)
      throw error
    }
    
    // 3. Generate Prisma client
    console.log('🔧 Generating Prisma client...')
    try {
      execSync('npx prisma generate', { 
        stdio: 'inherit',
        env: {
          ...process.env,
          DATABASE_URL: DATABASE_URL
        }
      })
      console.log('✅ Prisma client generated!')
    } catch (error) {
      console.error('❌ Prisma client generation failed:', error.message)
      throw error
    }
    
    // 4. Test connection with new client
    console.log('🔄 Testing connection with new client...')
    const newPrisma = new PrismaClient({
      datasources: {
        db: {
          url: DATABASE_URL
        }
      }
    })
    
    try {
      const result = await newPrisma.$queryRaw`SELECT 1 as test`
      console.log('✅ Connection test successful!')
      
      // Test if tables were created
      const tables = await newPrisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `
      console.log('📋 Tables created:', tables.map(t => t.table_name))
      
      // Test a simple query on users table
      const userCount = await newPrisma.user.count()
      console.log('👥 Users table accessible, count:', userCount)
      
    } catch (error) {
      console.error('❌ Connection test failed:', error.message)
      throw error
    } finally {
      await newPrisma.$disconnect()
    }
    
    // 5. Create basic system settings
    console.log('⚙️ Creating system settings...')
    const systemPrisma = new PrismaClient({
      datasources: {
        db: {
          url: DATABASE_URL
        }
      }
    })
    
    try {
      const systemSettings = [
        {
          settingKey: 'app_version',
          settingValue: { version: '1.0.0' },
          description: 'Current application version',
          isPublic: true
        },
        {
          settingKey: 'database_setup',
          settingValue: { 
            setupDate: new Date().toISOString(),
            schemaVersion: '1.0.0'
          },
          description: 'Database setup information',
          isPublic: false
        }
      ]
      
      for (const setting of systemSettings) {
        try {
          await systemPrisma.systemSetting.upsert({
            where: { settingKey: setting.settingKey },
            update: setting,
            create: setting
          })
          console.log(`✅ Created/updated setting: ${setting.settingKey}`)
        } catch (error) {
          console.log(`⚠️ Setting ${setting.settingKey} failed:`, error.message)
        }
      }
      
    } catch (error) {
      console.log('⚠️ System settings creation failed:', error.message)
    } finally {
      await systemPrisma.$disconnect()
    }
    
    console.log('🎉 Database push completed successfully!')
    console.log('📝 Next steps:')
    console.log('   1. Your database schema is now deployed to Supabase')
    console.log('   2. Prisma client is generated and ready to use')
    console.log('   3. You can now run: npm run db:seed (to add demo data)')
    console.log('   4. Start your app with: npm run dev')
    
  } catch (error) {
    console.error('❌ Database push failed:', error.message)
    console.error('🔍 Full error:', error)
    process.exit(1)
  }
}

// Run the push
pushDatabase()
