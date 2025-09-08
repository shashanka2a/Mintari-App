const { PrismaClient } = require('@prisma/client')

// Database connection with pooler
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.mzmoxjueezoukioswfga:WFgTyBHJkrLmn5B5@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
    }
  }
})

async function seedDatabase() {
  try {
    console.log('🌱 Seeding Mintari database...')
    
    // 1. Create demo user
    console.log('👤 Creating demo user...')
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@mintari.com' },
      update: {},
      create: {
        email: 'demo@mintari.com',
        username: 'demo_user',
        fullName: 'Demo User',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        onboardingCompleted: true,
        isActive: true
      }
    })
    console.log('✅ Demo user created:', demoUser.email)
    
    // 2. Create user preferences
    console.log('⚙️ Creating user preferences...')
    await prisma.userPreferences.upsert({
      where: { userId: demoUser.id },
      update: {},
      create: {
        userId: demoUser.id,
        defaultGenerationStyle: 'ghibli',
        autoSaveToCollection: true,
        emailNotifications: true,
        pushNotifications: true,
        marketingEmails: false,
        themePreference: 'light',
        language: 'en'
      }
    })
    console.log('✅ User preferences created')
    
    // 3. Create demo uploads
    console.log('📁 Creating demo uploads...')
    const demoUploads = [
      {
        userId: demoUser.id,
        originalFilename: 'forest_portrait.jpg',
        filePath: '/uploads/demo/forest_portrait.jpg',
        fileSize: 2048576, // 2MB
        mimeType: 'image/jpeg',
        imageWidth: 1920,
        imageHeight: 1080,
        uploadStatus: 'COMPLETED'
      },
      {
        userId: demoUser.id,
        originalFilename: 'mountain_landscape.png',
        filePath: '/uploads/demo/mountain_landscape.png',
        fileSize: 1536000, // 1.5MB
        mimeType: 'image/png',
        imageWidth: 1600,
        imageHeight: 900,
        uploadStatus: 'COMPLETED'
      }
    ]
    
    const createdUploads = []
    for (const upload of demoUploads) {
      const createdUpload = await prisma.upload.create({
        data: upload
      })
      createdUploads.push(createdUpload)
      console.log(`✅ Created upload: ${upload.originalFilename}`)
    }
    
    // 4. Create demo AI generations
    console.log('🤖 Creating demo AI generations...')
    const demoGenerations = [
      {
        userId: demoUser.id,
        uploadId: createdUploads[0].id,
        generationType: 'GHIBLI',
        prompt: 'Transform into Studio Ghibli style with magical forest atmosphere',
        generationStatus: 'COMPLETED',
        progressPercentage: 100,
        processingStartedAt: new Date(Date.now() - 300000), // 5 minutes ago
        processingCompletedAt: new Date(Date.now() - 240000) // 4 minutes ago
      },
      {
        userId: demoUser.id,
        uploadId: createdUploads[1].id,
        generationType: 'STUDIO_GHIBLI',
        prompt: 'Convert to Studio Ghibli mountain landscape with ethereal lighting',
        generationStatus: 'COMPLETED',
        progressPercentage: 100,
        processingStartedAt: new Date(Date.now() - 600000), // 10 minutes ago
        processingCompletedAt: new Date(Date.now() - 540000) // 9 minutes ago
      }
    ]
    
    const createdGenerations = []
    for (const generation of demoGenerations) {
      const createdGeneration = await prisma.aIGeneration.create({
        data: generation
      })
      createdGenerations.push(createdGeneration)
      console.log(`✅ Created generation: ${generation.generationType}`)
    }
    
    // 5. Create demo generated images
    console.log('🎨 Creating demo generated images...')
    const demoImages = [
      {
        generationId: createdGenerations[0].id,
        imageUrl: 'https://images.unsplash.com/photo-1610114586897-20495783e96c?w=800&h=600&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1610114586897-20495783e96c?w=300&h=200&fit=crop',
        imageWidth: 800,
        imageHeight: 600,
        fileSize: 1024000,
        generationVariant: 1,
        isSelected: true
      },
      {
        generationId: createdGenerations[0].id,
        imageUrl: 'https://images.unsplash.com/photo-1610114586897-20495783e96c?w=800&h=600&fit=crop&sat=1.2',
        thumbnailUrl: 'https://images.unsplash.com/photo-1610114586897-20495783e96c?w=300&h=200&fit=crop&sat=1.2',
        imageWidth: 800,
        imageHeight: 600,
        fileSize: 980000,
        generationVariant: 2,
        isSelected: false
      },
      {
        generationId: createdGenerations[1].id,
        imageUrl: 'https://images.unsplash.com/photo-1618298363483-e31a31f1a1e2?w=800&h=600&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1618298363483-e31a31f1a1e2?w=300&h=200&fit=crop',
        imageWidth: 800,
        imageHeight: 600,
        fileSize: 1100000,
        generationVariant: 1,
        isSelected: true
      }
    ]
    
    const createdImages = []
    for (const image of demoImages) {
      const createdImage = await prisma.generatedImage.create({
        data: image
      })
      createdImages.push(createdImage)
      console.log(`✅ Created generated image: variant ${image.generationVariant}`)
    }
    
    // 6. Create demo collections
    console.log('📚 Creating demo collections...')
    const demoCollections = [
      {
        userId: demoUser.id,
        title: 'Magical Forest Collection',
        description: 'A collection of forest-themed Ghibli transformations',
        isPublic: true
      },
      {
        userId: demoUser.id,
        title: 'Mountain Landscapes',
        description: 'Beautiful mountain scenes in Studio Ghibli style',
        isPublic: false
      }
    ]
    
    const createdCollections = []
    for (const collection of demoCollections) {
      const createdCollection = await prisma.collection.create({
        data: collection
      })
      createdCollections.push(createdCollection)
      console.log(`✅ Created collection: ${collection.title}`)
    }
    
    // 7. Create demo collection items
    console.log('📝 Creating demo collection items...')
    const demoItems = [
      {
        collectionId: createdCollections[0].id,
        uploadId: createdUploads[0].id,
        generatedImageId: createdImages[0].id,
        title: 'Enchanted Forest Portrait',
        description: 'A magical forest scene transformed into Ghibli style',
        tags: ['forest', 'magical', 'ghibli', 'nature'],
        isFavorite: true
      },
      {
        collectionId: createdCollections[1].id,
        uploadId: createdUploads[1].id,
        generatedImageId: createdImages[2].id,
        title: 'Mystical Mountain View',
        description: 'A breathtaking mountain landscape in Studio Ghibli style',
        tags: ['mountain', 'landscape', 'studio-ghibli', 'nature'],
        isFavorite: false
      }
    ]
    
    for (const item of demoItems) {
      await prisma.collectionItem.create({
        data: item
      })
      console.log(`✅ Created collection item: ${item.title}`)
    }
    
    // 8. Create demo NFT minting
    console.log('🪙 Creating demo NFT minting...')
    await prisma.nFTMinting.create({
      data: {
        userId: demoUser.id,
        generatedImageId: createdImages[0].id,
        collectionItemId: null,
        mintStatus: 'COMPLETED',
        tokenId: '12345',
        contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
        transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        gasFee: 0.002,
        mintPrice: 0.05,
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        metadataUrl: 'https://ipfs.io/ipfs/QmDemoMetadataHash',
        mintedAt: new Date(Date.now() - 86400000) // 1 day ago
      }
    })
    console.log('✅ Demo NFT minting created')
    
    // 9. Create demo physical order
    console.log('📦 Creating demo physical order...')
    await prisma.physicalOrder.create({
      data: {
        userId: demoUser.id,
        generatedImageId: createdImages[2].id,
        collectionItemId: null,
        orderStatus: 'SHIPPED',
        frameType: 'premium_wood',
        frameSize: '12x16',
        quantity: 1,
        unitPrice: 89.00,
        totalPrice: 89.00,
        shippingAddress: {
          name: 'Demo User',
          address1: '123 Demo Street',
          address2: 'Apt 4B',
          city: 'Demo City',
          state: 'DC',
          zipCode: '12345',
          country: 'United States'
        },
        paymentStatus: 'PAID',
        trackingNumber: 'DEMO123456789',
        estimatedDelivery: new Date(Date.now() + 604800000), // 7 days from now
        createdAt: new Date(Date.now() - 172800000) // 2 days ago
      }
    })
    console.log('✅ Demo physical order created')
    
    // 10. Create demo analytics
    console.log('📊 Creating demo analytics...')
    const demoAnalytics = [
      {
        userId: demoUser.id,
        eventType: 'screen_view',
        screenName: 'home',
        eventData: { duration: 15000 },
        sessionId: 'demo_session_1'
      },
      {
        userId: demoUser.id,
        eventType: 'button_click',
        screenName: 'upload',
        eventData: { buttonName: 'upload_photo', action: 'file_selected' },
        sessionId: 'demo_session_1'
      },
      {
        userId: demoUser.id,
        eventType: 'generation_started',
        screenName: 'generation',
        eventData: { generationId: createdGenerations[0].id, generationType: 'GHIBLI' },
        sessionId: 'demo_session_1'
      }
    ]
    
    for (const analytics of demoAnalytics) {
      await prisma.appAnalytics.create({
        data: analytics
      })
    }
    console.log('✅ Demo analytics created')
    
    // 11. Summary
    console.log('🎉 Database seeding completed successfully!')
    console.log('📊 Summary:')
    console.log(`   👤 Users: 1`)
    console.log(`   📁 Uploads: ${createdUploads.length}`)
    console.log(`   🤖 Generations: ${createdGenerations.length}`)
    console.log(`   🎨 Generated Images: ${createdImages.length}`)
    console.log(`   📚 Collections: ${createdCollections.length}`)
    console.log(`   🪙 NFT Mintings: 1`)
    console.log(`   📦 Physical Orders: 1`)
    console.log(`   📊 Analytics Events: ${demoAnalytics.length}`)
    
    console.log('🔑 Demo user credentials:')
    console.log(`   Email: demo@mintari.com`)
    console.log(`   Username: demo_user`)
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message)
    console.error('🔍 Full error:', error)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Database connection closed')
  }
}

// Run the seeding
seedDatabase()
