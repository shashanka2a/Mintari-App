#!/bin/bash

# Mintari NFT Contract Deployment Script
echo "🚀 Mintari NFT Contract Deployment Script"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/hardhat" ]; then
    echo "📦 Installing deployment dependencies..."
    npm install --save-dev @nomicfoundation/hardhat-toolbox @openzeppelin/contracts hardhat dotenv
fi

# Check if .env.deploy exists
if [ ! -f ".env.deploy" ]; then
    echo "⚠️  .env.deploy file not found!"
    echo "📝 Please create .env.deploy file with your private key:"
    echo ""
    echo "PRIVATE_KEY=your_private_key_here"
    echo ""
    echo "💡 Get your private key from MetaMask: Account Details > Export Private Key"
    echo "🔒 Never commit your private key to version control!"
    exit 1
fi

echo "✅ Environment file found"

# Compile contracts
echo "🔨 Compiling contracts..."
npx hardhat compile

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed!"
    exit 1
fi

echo "✅ Contracts compiled successfully"

# Ask user which network to deploy to
echo ""
echo "🌐 Which network would you like to deploy to?"
echo "1) Base Sepolia (Recommended)"
echo "2) Sepolia"
echo "3) Local (for testing)"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        network="baseSepolia"
        echo "🚀 Deploying to Base Sepolia..."
        ;;
    2)
        network="sepolia"
        echo "🚀 Deploying to Sepolia..."
        ;;
    3)
        network="localhost"
        echo "🚀 Deploying to local network..."
        echo "⚠️  Make sure to run 'npx hardhat node' in another terminal first!"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

# Deploy contract
echo ""
echo "⏳ Deploying contract..."
npx hardhat run scripts/deploy.js --network $network

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Copy the contract address from the output above"
    echo "2. Add it to your .env.local file:"
    echo "   NEXT_PUBLIC_ERC1155_CONTRACT_ADDRESS=0x..."
    echo "3. Restart your development server"
    echo "4. Test the NFT minting functionality"
    echo ""
    echo "🔗 Check the deployment info in the deployments/ folder"
else
    echo "❌ Deployment failed!"
    echo "💡 Common issues:"
    echo "   - Insufficient balance (get testnet ETH from faucets)"
    echo "   - Wrong private key"
    echo "   - Network connection issues"
    exit 1
fi
