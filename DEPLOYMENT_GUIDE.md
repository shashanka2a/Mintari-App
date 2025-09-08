# 🚀 NFT Contract Deployment Guide

## 📋 Prerequisites

1. **Node.js 18+** installed
2. **MetaMask** or compatible wallet
3. **Testnet ETH** for gas fees
4. **Private key** of your deployment wallet

## 🔧 Setup

### 1. Install Dependencies

```bash
# Install Hardhat and dependencies
npm install --save-dev @nomicfoundation/hardhat-toolbox @openzeppelin/contracts hardhat dotenv

# Or use the deployment package
npm install --package-lock-only package-deploy.json
```

### 2. Environment Setup

Create a `.env.deploy` file in the project root:

```bash
# Private key of the account that will deploy the contract
PRIVATE_KEY=your_private_key_here

# Optional: Custom RPC URLs
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Optional: API Keys for verification
BASESCAN_API_KEY=your_basescan_api_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### 3. Get Testnet ETH

**Base Sepolia:**
- Faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- You need at least 0.01 ETH for deployment

**Sepolia:**
- Faucet: https://sepoliafaucet.com/
- You need at least 0.01 ETH for deployment

## 🚀 Deployment

### Deploy to Base Sepolia (Recommended)

```bash
# Compile contracts
npx hardhat compile

# Deploy to Base Sepolia
npx hardhat run scripts/deploy.js --network baseSepolia
```

### Deploy to Sepolia

```bash
# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia
```

### Deploy Locally (Testing)

```bash
# Start local node
npx hardhat node

# Deploy to local network (in another terminal)
npx hardhat run scripts/deploy.js --network localhost
```

## 📊 Deployment Output

After successful deployment, you'll see:

```
✅ Contract deployed successfully!
📍 Contract Address: 0x1234567890abcdef...
🔗 Transaction Hash: 0xabcdef1234567890...

📊 Deployment Details:
   - Gas Used: 1234567
   - Gas Price: 20.5 gwei
   - Deployment Cost: 0.025 ETH

🎉 Deployment Complete!

📋 Next Steps:
1. Add the contract address to your environment variables:
   NEXT_PUBLIC_ERC1155_CONTRACT_ADDRESS=0x1234567890abcdef...
```

## 🔍 Contract Verification

### Verify on BaseScan (Base Sepolia)

```bash
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS> "https://mintari.app/api/metadata/" <OWNER_ADDRESS>
```

### Verify on Etherscan (Sepolia)

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> "https://mintari.app/api/metadata/" <OWNER_ADDRESS>
```

## 🔧 Frontend Integration

### 1. Update Environment Variables

Add to your `.env.local` file:

```bash
NEXT_PUBLIC_ERC1155_CONTRACT_ADDRESS=0x1234567890abcdef...
NEXT_PUBLIC_NETWORK_NAME=baseSepolia
NEXT_PUBLIC_CHAIN_ID=84532
```

### 2. Update Wallet Configuration

The contract address will be automatically used from the environment variable in `lib/config/wallet.ts`.

### 3. Test the Integration

1. Connect your wallet to the app
2. Switch to the correct network (Base Sepolia)
3. Try minting an NFT
4. Check the transaction on the block explorer

## 🧪 Testing the Contract

### Basic Functions

```javascript
// Get contract instance
const contract = new ethers.Contract(contractAddress, abi, signer);

// Mint a token
await contract.mint(userAddress, 1, "https://metadata.uri");

// Set token price
await contract.setTokenPrice(tokenId, ethers.parseEther("0.01"));

// Public mint
await contract.publicMint(tokenId, 1, { value: ethers.parseEther("0.01") });
```

## 📁 Generated Files

After deployment, these files will be created:

- `deployments/baseSepolia-84532.json` - Deployment info
- `deployment.env` - Environment template
- `artifacts/` - Contract artifacts
- `cache/` - Hardhat cache

## 🚨 Important Notes

1. **Never commit private keys** to version control
2. **Test on testnet first** before mainnet deployment
3. **Keep deployment info** for future reference
4. **Verify contracts** on block explorers
5. **Test all functions** before going live

## 🆘 Troubleshooting

### Common Issues

1. **Insufficient Balance**
   - Get more testnet ETH from faucets
   - Check gas price settings

2. **Network Issues**
   - Verify RPC URL is correct
   - Check network configuration

3. **Compilation Errors**
   - Update Solidity version
   - Check OpenZeppelin imports

4. **Deployment Fails**
   - Increase gas limit
   - Check contract parameters

### Getting Help

- Check Hardhat documentation: https://hardhat.org/docs
- OpenZeppelin contracts: https://docs.openzeppelin.com/contracts/
- Base documentation: https://docs.base.org/

## 🎉 Success!

Once deployed, your NFT contract will be ready to:
- Mint AI-generated art as NFTs
- Set custom prices for tokens
- Handle public minting
- Manage metadata URIs
- Support batch operations

The contract address can now be used in your Mintari app for NFT minting functionality!
