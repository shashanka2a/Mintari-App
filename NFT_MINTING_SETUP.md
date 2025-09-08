# 🪙 NFT Minting System Setup Guide

## 🎉 **Implementation Complete!**

Your Mintari app now has a comprehensive NFT minting system with wallet integration, smart contract interaction, and beautiful UI components.

## 🔧 **Environment Variables**

Add these variables to your `.env.local` file:

```bash
# NFT Minting Configuration
NEXT_PUBLIC_ERC1155_CONTRACT_ADDRESS=0xYourContractAddressHere
NEXT_PUBLIC_APP_URL=https://your-app-domain.com

# Wallet Configuration (already configured in lib/config/wallet.ts)
# Base Sepolia: Chain ID 84532
# Sepolia: Chain ID 11155111
```

## 🏗️ **Smart Contract Setup**

### **ERC-1155 Edition Contract**
You'll need to deploy an ERC-1155 Edition contract to Base Sepolia testnet. Here's what the contract should support:

```solidity
// Key functions your contract should have:
function mint(
    address to,
    uint256 id,
    uint256 amount,
    bytes calldata data
) external;

function mintBatch(
    address to,
    uint256[] calldata ids,
    uint256[] calldata amounts,
    bytes calldata data
) external;

function uri(uint256 id) external view returns (string memory);
```

### **Contract Deployment**
1. Deploy to Base Sepolia testnet
2. Set the contract address in `NEXT_PUBLIC_ERC1155_CONTRACT_ADDRESS`
3. Verify the contract on BaseScan

## 🔗 **Wallet Integration**

### **Supported Networks**
- ✅ **Base Sepolia** (Default) - Chain ID: 84532
- ✅ **Sepolia** - Chain ID: 11155111

### **Supported Wallets**
- ✅ **MetaMask**
- ✅ **WalletConnect compatible wallets**
- ✅ **Any Web3 wallet with `window.ethereum`**

### **Features**
- ✅ **Auto-connect** on page load
- ✅ **Network switching** with one click
- ✅ **Address formatting** and copying
- ✅ **Explorer links** for transactions
- ✅ **Error handling** with user-friendly messages

## 🎨 **UI Components**

### **ConnectWalletModal**
- Beautiful modal with network information
- One-click wallet connection
- Network status indicators
- Error handling and user guidance

### **MintConfirmationSheet**
- Asset preview before minting
- Gas fee estimation (≈ $0 on testnet)
- Transaction progress tracking
- Success/error states with explorer links

## 🔌 **API Endpoints**

### **POST /api/mint**
Batch mint selected assets to user's wallet.

**Request:**
```json
{
  "assetIds": ["asset-id-1", "asset-id-2"],
  "userAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "userId": "user-id"
}
```

**Response:**
```json
{
  "success": true,
  "transactionHashes": [
    "0x1234...",
    "0x5678..."
  ]
}
```

## 📊 **Metadata System**

### **NFT Metadata Structure**
```json
{
  "name": "Mintari Art #123456",
  "description": "AI-generated art created with Studio Ghibli style",
  "image": "https://supabase-storage-url/image.png",
  "attributes": [
    {
      "trait_type": "Style",
      "value": "Studio Ghibli"
    },
    {
      "trait_type": "Seed",
      "value": "12345"
    },
    {
      "trait_type": "Generation Date",
      "value": "2024-01-15"
    },
    {
      "trait_type": "Model",
      "value": "stable-diffusion-xl"
    },
    {
      "trait_type": "Generation Time",
      "value": "5.2s"
    }
  ],
  "external_url": "https://mintari.app/c/collection-slug",
  "background_color": "ffffff"
}
```

### **Metadata Storage**
- ✅ **Supabase URLs** for image storage
- ✅ **IPFS-ready** metadata structure
- ✅ **Rich attributes** for NFT marketplaces
- ✅ **External links** to collection pages

## 🚀 **Usage Examples**

### **1. Connect Wallet**
```tsx
import { ConnectWalletModal } from './components/ConnectWalletModal';

<ConnectWalletModal>
  <Button>Connect Wallet</Button>
</ConnectWalletModal>
```

### **2. Mint NFTs**
```tsx
import { MintConfirmationSheet } from './components/MintConfirmationSheet';

<MintConfirmationSheet
  assets={selectedAssets}
  userAddress={walletAddress}
  userId={userId}
  onMintSuccess={(txHashes) => {
    console.log('Minted:', txHashes);
  }}
>
  <Button>Mint NFTs</Button>
</MintConfirmationSheet>
```

### **3. Use Wallet Hook**
```tsx
import { useWallet } from './hooks/useWallet';

const {
  isConnected,
  address,
  isCorrectNetwork,
  connect,
  switchNetwork
} = useWallet();
```

## 🔒 **Security Features**

### **Input Validation**
- ✅ **Ethereum address** format validation
- ✅ **Batch size** limits (max 10 assets)
- ✅ **User ownership** verification
- ✅ **Asset existence** checks

### **Error Handling**
- ✅ **Network errors** with retry options
- ✅ **Transaction failures** with detailed messages
- ✅ **User-friendly** error descriptions
- ✅ **Fallback states** for all scenarios

## 📱 **User Experience**

### **Minting Flow**
1. **Select Assets** → Choose images to mint
2. **Connect Wallet** → One-click wallet connection
3. **Confirm Details** → Review assets and fees
4. **Mint NFTs** → Batch mint with progress tracking
5. **View Results** → Transaction hashes and explorer links

### **Visual Feedback**
- ✅ **Loading states** during minting
- ✅ **Progress indicators** for batch operations
- ✅ **Success animations** and celebrations
- ✅ **Error states** with recovery options

## 🧪 **Testing**

### **Testnet Setup**
1. **Get Testnet ETH** from Base Sepolia faucet
2. **Deploy Contract** to testnet
3. **Test Minting** with small batches
4. **Verify Transactions** on BaseScan

### **Test Scenarios**
- ✅ **Single asset** minting
- ✅ **Batch minting** (multiple assets)
- ✅ **Network switching** during mint
- ✅ **Error handling** (insufficient gas, network issues)
- ✅ **Wallet disconnection** during process

## 🎯 **Production Checklist**

### **Before Launch**
- [ ] Deploy ERC-1155 contract to mainnet
- [ ] Set production contract address
- [ ] Configure IPFS for metadata storage
- [ ] Test with real wallet connections
- [ ] Verify gas fee calculations
- [ ] Set up monitoring and logging

### **Smart Contract**
- [ ] Audit contract code
- [ ] Implement access controls
- [ ] Add emergency pause functionality
- [ ] Set up metadata URI management
- [ ] Configure royalty settings

### **Infrastructure**
- [ ] Set up IPFS pinning service
- [ ] Configure CDN for metadata
- [ ] Implement rate limiting
- [ ] Set up transaction monitoring
- [ ] Configure error tracking

## 🎉 **Ready for Hackathon!**

Your NFT minting system includes:

- ✅ **Professional wallet integration** with MetaMask support
- ✅ **Beautiful UI components** with loading states and animations
- ✅ **Comprehensive error handling** with user-friendly messages
- ✅ **Batch minting capabilities** for efficient operations
- ✅ **Rich metadata system** with attributes and external links
- ✅ **Testnet ready** with Base Sepolia support
- ✅ **Production scalable** architecture

The system is ready for integration with your existing Mintari app and can handle the complete NFT minting workflow from asset selection to blockchain confirmation! 🚀

## 🔗 **Integration Points**

### **With Collection System**
- Assets can be minted directly from collections
- Collection metadata included in NFT attributes
- Public collection links in NFT metadata

### **With Generation System**
- Generated images can be minted immediately
- Generation parameters stored as NFT attributes
- Seed and model information preserved

### **With User System**
- User ownership verification
- Wallet address linking
- Minting history tracking
