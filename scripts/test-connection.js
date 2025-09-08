const { PrismaClient } = require('@prisma/client')

// Database connection with pooler
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.mzmoxjueezoukioswfga:WFgTyBHJkrLmn5B5@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
    }
  }
})

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...')
    
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database connection successful!')
    console.log('📊 Test query result:', result)
    
    // Test database info
    const dbInfo = await prisma.$queryRaw`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as postgres_version,
        now() as current_time
    `
    console.log('📋 Database Info:', dbInfo[0])
    
    // Test if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    console.log('📋 Existing tables:', tables.map(t => t.table_name))
    
    // Test Prisma client generation
    console.log('🔄 Testing Prisma client...')
    const userCount = await prisma.user.count()
    console.log('👥 Users in database:', userCount)
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.error('🔍 Full error:', error)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Database connection closed')
  }
}

// Run the test
testConnection()
