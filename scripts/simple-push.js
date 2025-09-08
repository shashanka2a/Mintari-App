const { execSync } = require('child_process')

// Database connection with SSL and proper Supabase configuration
const DATABASE_URL = "postgresql://postgres.mzmoxjueezoukioswfga:WFgTyBHJkrLmn5B5@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"

// Environment setup for SSL connections
const envWithSSL = {
  ...process.env,
  DATABASE_URL: DATABASE_URL,
  PGSSLMODE: 'require',
  PGSSLROOTCERT: 'system',
  PGSSLCERT: '',
  PGSSLKEY: ''
}

async function simplePush() {
  try {
    console.log('🚀 Simple Database Schema Push to Supabase')
    console.log('=' .repeat(50))
    console.log('🔗 Using connection pooler with SSL...')
    
    // Step 1: Generate Prisma client
    console.log('\n🔧 Step 1: Generating Prisma client...')
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      env: envWithSSL
    })
    console.log('✅ Prisma client generated!')
    
    // Step 2: Push schema directly (no migrations)
    console.log('\n📋 Step 2: Pushing schema to database...')
    console.log('⚠️ This will reset the database and create all tables...')
    
    execSync('npx prisma db push --force-reset', { 
      stdio: 'inherit',
      env: envWithSSL
    })
    console.log('✅ Schema pushed successfully!')
    
    // Step 3: Verify with a simple test
    console.log('\n🧪 Step 3: Testing database...')
    const testScript = `
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      
      async function test() {
        try {
          // Test basic connection
          const result = await prisma.\$queryRaw\`SELECT 1 as test\`
          console.log('✅ Basic connection test:', result[0])
          
          // Test if users table exists
          const tables = await prisma.\$queryRaw\`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
          \`
          console.log('✅ Users table exists:', tables.length > 0)
          
          // Test user count (should be 0)
          const userCount = await prisma.user.count()
          console.log('✅ User count:', userCount)
          
          await prisma.\$disconnect()
          console.log('🎉 All tests passed!')
        } catch (error) {
          console.error('❌ Test failed:', error.message)
          process.exit(1)
        }
      }
      
      test()
    `
    
    require('fs').writeFileSync('temp-test.js', testScript)
    execSync('node temp-test.js', { 
      stdio: 'inherit',
      env: envWithSSL
    })
    require('fs').unlinkSync('temp-test.js')
    
    console.log('\n🎉 DATABASE SETUP COMPLETED!')
    console.log('=' .repeat(50))
    console.log('✅ All tables created successfully')
    console.log('✅ Prisma client ready to use')
    console.log('✅ Database connection working')
    console.log('\n🚀 Next steps:')
    console.log('   1. Run: npm run db:seed (to add demo data)')
    console.log('   2. Run: npm run dev (to start your app)')
    
  } catch (error) {
    console.error('\n❌ SETUP FAILED!')
    console.error('Error:', error.message)
    process.exit(1)
  }
}

// Run the simple push
simplePush()
