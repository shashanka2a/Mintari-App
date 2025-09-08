// Wallet and blockchain configuration
export const WALLET_CONFIG = {
  // Supported networks
  NETWORKS: {
    BASE_SEPOLIA: {
      chainId: '0x14a34', // 84532
      chainName: 'Base Sepolia',
      rpcUrls: ['https://sepolia.base.org'],
      blockExplorerUrls: ['https://sepolia.basescan.org'],
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
      },
    },
    SEPOLIA: {
      chainId: '0xaa36a7', // 11155111
      chainName: 'Sepolia',
      rpcUrls: ['https://sepolia.infura.io/v3/'],
      blockExplorerUrls: ['https://sepolia.etherscan.io'],
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
      },
    },
  },
  
  // Default network
  DEFAULT_NETWORK: 'BASE_SEPOLIA',
  
  // Contract addresses
  CONTRACTS: {
    ERC1155_EDITION: process.env.NEXT_PUBLIC_ERC1155_CONTRACT_ADDRESS || '',
  },
  
  // Gas settings
  GAS_SETTINGS: {
    GAS_LIMIT: '500000',
    GAS_PRICE: '20000000000', // 20 gwei
  },
  
  // Minting settings
  MINTING: {
    BATCH_SIZE: 10, // Max assets per batch
    CONFIRMATION_BLOCKS: 2, // Blocks to wait for confirmation
  },
} as const;

// Network validation
export function isValidNetwork(chainId: string): boolean {
  const validChainIds = Object.values(WALLET_CONFIG.NETWORKS).map(network => network.chainId);
  return validChainIds.includes(chainId);
}

// Get network info by chain ID
export function getNetworkInfo(chainId: string) {
  return Object.values(WALLET_CONFIG.NETWORKS).find(network => network.chainId === chainId);
}

// Format chain ID for display
export function formatChainId(chainId: string): string {
  return parseInt(chainId, 16).toString();
}

// Check if wallet is connected to correct network
export function isCorrectNetwork(chainId: string): boolean {
  const defaultNetwork = WALLET_CONFIG.NETWORKS[WALLET_CONFIG.DEFAULT_NETWORK];
  return chainId === defaultNetwork.chainId;
}
