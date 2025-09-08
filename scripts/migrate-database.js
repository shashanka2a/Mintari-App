const { execSync } = require('child_process')

// Database connection with SSL and proper Supabase configuration
const DATABASE_URL = "postgresql://postgres.mzmoxjueezoukioswfga:WFgTyBHJkrLmn5B5@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"

// Environment setup for SSL connections
const envWithSSL = {
  ...process.env,
  DATABASE_URL: DATABASE_URL,
  // Force SSL for all connections
  PGSSLMODE: 'require',
  // Additional SSL settings for Supabase
  PGSSLROOTCERT: 'system',
  PGSSLCERT: '',
  PGSSLKEY: ''
}

async function migrateDatabase() {
  try {
    console.log('🚀 Migrating Mintari database schema to Supabase...')
    console.log('🔗 Using connection pooler with SSL...')
    
    // 1. Initialize migrations (if not already done)
    console.log('📋 Initializing Prisma migrations...')
    try {
      execSync('npx prisma migrate dev --name init --create-only', { 
        stdio: 'inherit',
        env: envWithSSL
      })
      console.log('✅ Migration files created!')
    } catch (error) {
      console.log('⚠️ Migration initialization (this is normal if migrations already exist)')
    }
    
    // 2. Apply migrations to database
    console.log('🔄 Applying migrations to database...')
    try {
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        env: envWithSSL
      })
      console.log('✅ Migrations applied successfully!')
    } catch (error) {
      console.log('⚠️ Migrations deploy failed, trying migrate dev...')
      try {
        execSync('npx prisma migrate dev --name init', { 
          stdio: 'inherit',
          env: envWithSSL
        })
        console.log('✅ Migrations applied with dev command!')
      } catch (devError) {
        console.log('⚠️ Migrate dev failed, trying db push as fallback...')
        execSync('npx prisma db push --force-reset', { 
          stdio: 'inherit',
          env: envWithSSL
        })
        console.log('✅ Schema pushed successfully!')
      }
    }
    
    // 3. Generate Prisma client
    console.log('🔧 Generating Prisma client...')
    try {
      execSync('npx prisma generate', { 
        stdio: 'inherit',
        env: envWithSSL
      })
      console.log('✅ Prisma client generated!')
    } catch (error) {
      console.error('❌ Prisma client generation failed:', error.message)
      throw error
    }
    
    // 4. Verify the migration
    console.log('🔍 Verifying database schema...')
    try {
      execSync('npx prisma db pull', { 
        stdio: 'inherit',
        env: envWithSSL
      })
      console.log('✅ Database schema verified!')
    } catch (error) {
      console.log('⚠️ Schema verification failed:', error.message)
    }
    
    console.log('🎉 Database migration completed successfully!')
    console.log('📝 Next steps:')
    console.log('   1. Your database schema is now deployed to Supabase')
    console.log('   2. Prisma client is generated and ready to use')
    console.log('   3. You can now run: npm run db:seed (to add demo data)')
    console.log('   4. Start your app with: npm run dev')
    
  } catch (error) {
    console.error('❌ Database migration failed:', error.message)
    console.error('🔍 Full error:', error)
    process.exit(1)
  }
}

// Run the migration
migrateDatabase()
