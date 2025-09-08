import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { WALLET_CONFIG } from '../../../lib/config/wallet';
import { withPost, validateRequired, validateEthereumAddress, requireAuth } from '../../../lib/api/apiWrapper';
import { MintRequest, MintResponse, ApiErrorCode } from '../../../lib/types/api';

const prisma = new PrismaClient();

// Mock NFT minting function (replace with actual contract interaction)
async function mintNFTs(assets: any[], userAddress: string): Promise<string[]> {
  // In a real implementation, this would:
  // 1. Connect to the ERC-1155 contract
  // 2. Prepare metadata URIs
  // 3. Call the batch mint function
  // 4. Return transaction hashes
  
  // For now, we'll simulate the minting process
  const transactionHashes: string[] = [];
  
  for (const asset of assets) {
    // Simulate transaction hash generation
    const txHash = `0x${Math.random().toString(16).substring(2, 66)}`;
    transactionHashes.push(txHash);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return transactionHashes;
}

// Generate metadata URI for an asset
function generateMetadataURI(asset: any): string {
  const metadata = {
    name: `Mintari Art #${asset.id.slice(-6)}`,
    description: `AI-generated art created with ${asset.prompt}`,
    image: asset.url,
    attributes: [
      {
        trait_type: 'Style',
        value: 'Studio Ghibli',
      },
      {
        trait_type: 'Seed',
        value: asset.seed?.toString() || 'Random',
      },
      {
        trait_type: 'Generation Date',
        value: new Date(asset.createdAt).toISOString().split('T')[0],
      },
      {
        trait_type: 'Model',
        value: asset.model || 'stable-diffusion-xl',
      },
      {
        trait_type: 'Generation Time',
        value: asset.generationTimeMs ? `${(asset.generationTimeMs / 1000).toFixed(1)}s` : 'Unknown',
      },
    ],
    external_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://mintari.app'}/c/${asset.collection?.publicSlug}`,
    background_color: 'ffffff',
  };

  // In a real implementation, you would upload this to IPFS or a metadata service
  // For now, we'll return a placeholder URI
  return `https://metadata.mintari.app/${asset.id}`;
}

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<MintResponse> {
  const { assetIds, userAddress, userId }: MintRequest = req.body;

  // Validate required fields
  validateRequired(req.body, ['assetIds', 'userAddress', 'userId']);
  
  // Validate assetIds array
  if (!Array.isArray(assetIds) || assetIds.length === 0) {
    const error = new Error('assetIds must be a non-empty array');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate batch size
  if (assetIds.length > WALLET_CONFIG.MINTING.BATCH_SIZE) {
    const error = new Error(`Too many assets (max ${WALLET_CONFIG.MINTING.BATCH_SIZE})`);
    error.name = 'ValidationError';
    throw error;
  }

  // Validate Ethereum address
  validateEthereumAddress(userAddress);

    // Get assets from database
    const assets = await prisma.asset.findMany({
      where: {
        id: {
          in: assetIds
        },
        userId: userId, // Ensure user owns the assets
      },
      include: {
        collection: {
          select: {
            publicSlug: true,
          }
        }
      }
    });

    if (assets.length !== assetIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Some assets not found or access denied',
        errorCode: 'ASSETS_NOT_FOUND'
      });
    }

    // Check if assets are already minted (you might want to add a minted flag to the Asset model)
    // For now, we'll skip this check

    // Generate metadata URIs
    const metadataURIs = assets.map(asset => generateMetadataURI(asset));

    // Mint NFTs (mock implementation)
    const transactionHashes = await mintNFTs(assets, userAddress);

    // Record minting in database (you might want to create an NFTMinting record)
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const txHash = transactionHashes[i];
      const metadataURI = metadataURIs[i];

      // Create NFT minting record
      await prisma.nftMinting.create({
        data: {
          userId: userId,
          assetId: asset.id,
          tokenId: `0x${Math.random().toString(16).substring(2, 10)}`, // Mock token ID
          contractAddress: WALLET_CONFIG.CONTRACTS.ERC1155_EDITION,
          transactionHash: txHash,
          metadataURI: metadataURI,
          mintStatus: 'COMPLETED',
          mintedAt: new Date(),
        }
      });
    }

    return res.status(200).json({
      success: true,
      transactionHashes,
    });

  } catch (error) {
    console.error('Mint API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      errorCode: 'INTERNAL_ERROR'
    });
  } finally {
    await prisma.$disconnect();
  }
}
