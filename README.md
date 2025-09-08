
# 🎨 Mintari - AI Art NFT Platform

A Progressive Web App (PWA) that transforms your photos into AI-generated art and mints them as NFTs on the blockchain.

## ✨ Features

- **AI Art Generation**: Upload photos and transform them into Studio Ghibli-style artwork
- **NFT Minting**: Mint your AI-generated art as ERC-1155 NFTs on Base blockchain
- **PWA Support**: Install as a native app on mobile and desktop
- **Wallet Integration**: Connect with MetaMask and other Web3 wallets
- **Collection Management**: Save and organize your generated artwork
- **Responsive Design**: Beautiful UI that works on all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask wallet (for NFT minting)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd mintari-app

# Install dependencies
npm install

# Set up environment variables
cp env.local.example .env.local
# Edit .env.local with your API keys and configuration
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

## 🔧 Configuration

### Required Environment Variables

Copy `env.local.example` to `.env.local` and configure:

```bash
# Database (Supabase)
DATABASE_URL="your-supabase-database-url"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# AI Generation
OPENAI_API_KEY="your-openai-api-key"
REPLICATE_API_TOKEN="your-replicate-token"

# Blockchain (NFT Contract)
ALCHEMY_API_KEY="your-alchemy-api-key"
PRIVATE_KEY="your-wallet-private-key"
CONTRACT_ADDRESS="your-nft-contract-address"

# File Storage
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET="your-s3-bucket"
```

### Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed with sample data
npm run db:seed
```

## 📱 Usage

1. **Upload Photo**: Take or upload a photo from your device
2. **Generate Art**: AI transforms your photo into Studio Ghibli-style artwork
3. **Select Frame**: Choose your favorite generated frame
4. **Mint NFT**: Connect wallet and mint as an NFT on Base blockchain
5. **Manage Collection**: View and organize your minted artwork

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Blockchain**: Base Sepolia (testnet) / Base (mainnet)
- **AI**: OpenAI GPT-4 + Replicate for image generation
- **Storage**: AWS S3 for file storage
- **UI Components**: Radix UI with custom styling

## 📁 Project Structure

```
├── pages/                 # Next.js pages and API routes
├── src/
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   └── App.tsx           # Main application component
├── contracts/            # Smart contracts (Solidity)
├── lib/                  # Utilities and configurations
├── prisma/              # Database schema and migrations
└── scripts/             # Database and deployment scripts
```

## 🚀 Deployment

### NFT Contract Deployment

```bash
# Deploy to Base Sepolia (testnet)
npx hardhat run scripts/deploy.js --network baseSepolia

# Deploy to Base (mainnet)
npx hardhat run scripts/deploy.js --network base
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

### App Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🧪 Testing

```bash
# Run acceptance tests
npm run test:acceptance

# Test database connection
npm run db:test
```

## 📚 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push database schema
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio
- `npm run test` - Run acceptance tests

## 🔗 Links

- **Figma Design**: [Mintari PWA App Screens](https://www.figma.com/design/lLWa8kIcxpMe9t3VkFM937/Mintari-PWA-App-Screens)
- **Base Blockchain**: [Base Documentation](https://docs.base.org/)
- **Supabase**: [Supabase Documentation](https://supabase.com/docs)

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

Built with ❤️ by the Mintari team
  