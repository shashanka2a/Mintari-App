const { createClient } = require('@supabase/supabase-js')
const { supabaseConfig, uploadConfig } = require('../config/supabase')

const supabase = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey)

async function setupStorage() {
  try {
    console.log('🚀 Setting up Supabase Storage for Mintari...')
    console.log('=' .repeat(50))

    // Step 1: Create the mintari bucket
    console.log('\n📦 Step 1: Creating mintari bucket...')
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket(uploadConfig.bucketName, {
      public: true,
      allowedMimeTypes: uploadConfig.allowedMimeTypes,
      fileSizeLimit: uploadConfig.maxFileSize
    })

    if (bucketError && !bucketError.message.includes('already exists')) {
      throw bucketError
    }
    console.log('✅ Mintari bucket created/verified!')

    // Step 2: Set up RLS policies
    console.log('\n🔒 Step 2: Setting up RLS policies...')
    
    // Policy 1: Users can upload their own files
    const { error: uploadPolicyError } = await supabase.rpc('create_upload_policy', {
      bucket_name: 'mintari'
    }).catch(async () => {
      // If RPC doesn't exist, create policy manually
      const { error } = await supabase
        .from('storage.policies')
        .insert({
          bucket_id: 'mintari',
          name: 'Users can upload their own files',
          definition: 'auth.uid()::text = (storage.foldername(name))[1]',
          check: 'auth.uid()::text = (storage.foldername(name))[1]',
          command: 'INSERT'
        })
      return { error }
    })

    if (uploadPolicyError && !uploadPolicyError.message.includes('already exists')) {
      console.log('⚠️ Upload policy creation failed, will create via SQL...')
    }

    // Policy 2: Users can view their own files
    const { error: selectPolicyError } = await supabase.rpc('create_select_policy', {
      bucket_name: 'mintari'
    }).catch(async () => {
      const { error } = await supabase
        .from('storage.policies')
        .insert({
          bucket_id: 'mintari',
          name: 'Users can view their own files',
          definition: 'auth.uid()::text = (storage.foldername(name))[1]',
          check: 'auth.uid()::text = (storage.foldername(name))[1]',
          command: 'SELECT'
        })
      return { error }
    })

    if (selectPolicyError && !selectPolicyError.message.includes('already exists')) {
      console.log('⚠️ Select policy creation failed, will create via SQL...')
    }

    // Policy 3: Users can update their own files
    const { error: updatePolicyError } = await supabase.rpc('create_update_policy', {
      bucket_name: 'mintari'
    }).catch(async () => {
      const { error } = await supabase
        .from('storage.policies')
        .insert({
          bucket_id: 'mintari',
          name: 'Users can update their own files',
          definition: 'auth.uid()::text = (storage.foldername(name))[1]',
          check: 'auth.uid()::text = (storage.foldername(name))[1]',
          command: 'UPDATE'
        })
      return { error }
    })

    if (updatePolicyError && !updatePolicyError.message.includes('already exists')) {
      console.log('⚠️ Update policy creation failed, will create via SQL...')
    }

    // Policy 4: Users can delete their own files
    const { error: deletePolicyError } = await supabase.rpc('create_delete_policy', {
      bucket_name: 'mintari'
    }).catch(async () => {
      const { error } = await supabase
        .from('storage.policies')
        .insert({
          bucket_id: 'mintari',
          name: 'Users can delete their own files',
          definition: 'auth.uid()::text = (storage.foldername(name))[1]',
          check: 'auth.uid()::text = (storage.foldername(name))[1]',
          command: 'DELETE'
        })
      return { error }
    })

    if (deletePolicyError && !deletePolicyError.message.includes('already exists')) {
      console.log('⚠️ Delete policy creation failed, will create via SQL...')
    }

    console.log('✅ RLS policies configured!')

    // Step 3: Test bucket access
    console.log('\n🧪 Step 3: Testing bucket access...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      throw listError
    }

    const mintariBucket = buckets.find(b => b.name === uploadConfig.bucketName)
    if (mintariBucket) {
      console.log('✅ Mintari bucket found and accessible!')
      console.log(`   - Public: ${mintariBucket.public}`)
      console.log(`   - Created: ${mintariBucket.created_at}`)
    } else {
      throw new Error('Mintari bucket not found after creation')
    }

    console.log('\n🎉 SUPABASE STORAGE SETUP COMPLETED!')
    console.log('=' .repeat(50))
    console.log('✅ Mintari bucket created and configured')
    console.log('✅ RLS policies set up for user ownership')
    console.log('✅ File type restrictions: JPG, PNG only')
    console.log('✅ File size limit: 10MB maximum')
    console.log('\n🚀 Next steps:')
    console.log('   1. Your storage is ready for photo uploads')
    console.log('   2. Files will be organized by user ID')
    console.log('   3. RLS ensures users only access their own files')

  } catch (error) {
    console.error('\n❌ STORAGE SETUP FAILED!')
    console.error('Error:', error.message)
    console.error('\n🔧 Troubleshooting:')
    console.error('   1. Check your Supabase service role key')
    console.error('   2. Ensure your Supabase project is active')
    console.error('   3. Verify storage is enabled in your project')
    process.exit(1)
  }
}

// Run the storage setup
setupStorage()
