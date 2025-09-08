const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting Mintari NFT Contract Deployment...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Check if we have enough balance
  const balance = await deployer.provider.getBalance(deployer.address);
  if (balance < ethers.parseEther("0.01")) {
    console.error("❌ Insufficient balance for deployment. Need at least 0.01 ETH");
    console.log("💡 Get testnet ETH from:");
    console.log("   - Base Sepolia Faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
    console.log("   - Sepolia Faucet: https://sepoliafaucet.com/");
    process.exit(1);
  }

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "(Chain ID:", network.chainId, ")\n");

  // Contract parameters
  const baseURI = "https://mintari.app/api/metadata/";
  const initialOwner = deployer.address;

  console.log("📋 Contract Parameters:");
  console.log("   - Base URI:", baseURI);
  console.log("   - Initial Owner:", initialOwner);
  console.log("   - Network:", network.name);
  console.log("");

  try {
    // Deploy the contract
    console.log("⏳ Deploying MintariNFT contract...");
    const MintariNFT = await ethers.getContractFactory("MintariNFT");
    
    const mintariNFT = await MintariNFT.deploy(baseURI, initialOwner);
    await mintariNFT.waitForDeployment();

    const contractAddress = await mintariNFT.getAddress();
    console.log("✅ Contract deployed successfully!");
    console.log("📍 Contract Address:", contractAddress);
    console.log("🔗 Transaction Hash:", mintariNFT.deploymentTransaction().hash);

    // Get deployment info
    const deploymentTx = mintariNFT.deploymentTransaction();
    const receipt = await deploymentTx.wait();
    const gasUsed = receipt.gasUsed;
    const gasPrice = deploymentTx.gasPrice;
    const deploymentCost = gasUsed * gasPrice;

    console.log("\n📊 Deployment Details:");
    console.log("   - Gas Used:", gasUsed.toString());
    console.log("   - Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");
    console.log("   - Deployment Cost:", ethers.formatEther(deploymentCost), "ETH");

    // Verify contract functions
    console.log("\n🔍 Verifying contract functions...");
    
    // Test basic functions
    const tokenIdCounter = await mintariNFT.getTokenIdCounter();
    console.log("   - Token ID Counter:", tokenIdCounter.toString());
    
    const baseURIFromContract = await mintariNFT.getBaseURI();
    console.log("   - Base URI:", baseURIFromContract);
    
    const owner = await mintariNFT.owner();
    console.log("   - Owner:", owner);

    // Create deployment info object
    const deploymentInfo = {
      contractAddress: contractAddress,
      network: network.name,
      chainId: network.chainId.toString(),
      deployer: deployer.address,
      baseURI: baseURI,
      initialOwner: initialOwner,
      deploymentTx: mintariNFT.deploymentTransaction().hash,
      gasUsed: gasUsed.toString(),
      gasPrice: gasPrice.toString(),
      deploymentCost: ethers.formatEther(deploymentCost),
      timestamp: new Date().toISOString(),
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash
    };

    // Save deployment info to file
    const deploymentFile = path.join(__dirname, "..", "deployments", `${network.name}-${network.chainId}.json`);
    const deploymentsDir = path.dirname(deploymentFile);
    
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Deployment info saved to:", deploymentFile);

    // Create environment file template
    const envTemplate = `# NFT Contract Configuration
NEXT_PUBLIC_ERC1155_CONTRACT_ADDRESS=${contractAddress}
NEXT_PUBLIC_NETWORK_NAME=${network.name}
NEXT_PUBLIC_CHAIN_ID=${network.chainId}

# Add this to your .env.local file
# NEXT_PUBLIC_ERC1155_CONTRACT_ADDRESS=${contractAddress}
`;

    const envFile = path.join(__dirname, "..", "deployment.env");
    fs.writeFileSync(envFile, envTemplate);
    console.log("📝 Environment template saved to:", envFile);

    // Display next steps
    console.log("\n🎉 Deployment Complete!");
    console.log("\n📋 Next Steps:");
    console.log("1. Add the contract address to your environment variables:");
    console.log(`   NEXT_PUBLIC_ERC1155_CONTRACT_ADDRESS=${contractAddress}`);
    console.log("\n2. Verify the contract on block explorer:");
    if (network.chainId === 84532n) {
      console.log(`   https://sepolia.basescan.org/address/${contractAddress}`);
    } else if (network.chainId === 11155111n) {
      console.log(`   https://sepolia.etherscan.io/address/${contractAddress}`);
    }
    console.log("\n3. Test the contract functions:");
    console.log("   - Mint a test token");
    console.log("   - Set token prices");
    console.log("   - Test public minting");
    console.log("\n4. Update your frontend configuration");
    console.log("   - Update lib/config/wallet.ts with the new contract address");

    // Test minting a sample token
    console.log("\n🧪 Testing contract with sample mint...");
    try {
      const sampleMetadataURI = "https://mintari.app/api/metadata/sample";
      const mintTx = await mintariNFT.mint(deployer.address, 1, sampleMetadataURI);
      await mintTx.wait();
      
      const newTokenId = await mintariNFT.getTokenIdCounter() - 1n;
      console.log("✅ Sample token minted successfully!");
      console.log("   - Token ID:", newTokenId.toString());
      console.log("   - Metadata URI:", await mintariNFT.uri(newTokenId));
    } catch (error) {
      console.log("⚠️  Sample mint failed (this is normal for some networks):", error.message);
    }

    console.log("\n🚀 Your Mintari NFT contract is ready to use!");
    console.log("📍 Contract Address:", contractAddress);

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
