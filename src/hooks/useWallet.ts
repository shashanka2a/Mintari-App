import { useState, useEffect, useCallback } from 'react';
import { WALLET_CONFIG, isValidNetwork, getNetworkInfo, isCorrectNetwork } from '../../lib/config/wallet';
import { toast } from 'sonner';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: string | null;
  networkName: string | null;
  isCorrectNetwork: boolean;
  isLoading: boolean;
  error: string | null;
}

interface WalletActions {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
  addNetwork: () => Promise<void>;
}

export function useWallet(): WalletState & WalletActions {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    networkName: null,
    isCorrectNetwork: false,
    isLoading: false,
    error: null,
  });

  // Check if wallet is available
  const isWalletAvailable = typeof window !== 'undefined' && window.ethereum;

  // Initialize wallet state
  useEffect(() => {
    if (!isWalletAvailable) return;

    const initializeWallet = async () => {
      try {
        if (!window.ethereum) {
          setState({ isConnected: false, address: null, chainId: null, networkName: null, isCorrectNetwork: false, isLoading: false, error: null });
          return;
        }
        
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });

        if (accounts.length > 0) {
          const networkInfo = getNetworkInfo(chainId);
          setState({
            isConnected: true,
            address: accounts[0],
            chainId,
            networkName: networkInfo?.chainName || 'Unknown',
            isCorrectNetwork: isCorrectNetwork(chainId),
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Wallet initialization error:', error);
        setState(prev => ({ ...prev, error: 'Failed to initialize wallet' }));
      }
    };

    initializeWallet();

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setState({
          isConnected: false,
          address: null,
          chainId: null,
          networkName: null,
          isCorrectNetwork: false,
          isLoading: false,
          error: null,
        });
      } else {
        setState(prev => ({
          ...prev,
          address: accounts[0],
        }));
      }
    };

    // Listen for chain changes
    const handleChainChanged = (chainId: string) => {
      const networkInfo = getNetworkInfo(chainId);
      setState(prev => ({
        ...prev,
        chainId,
        networkName: networkInfo?.chainName || 'Unknown',
        isCorrectNetwork: isCorrectNetwork(chainId),
      }));
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [isWalletAvailable]);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!isWalletAvailable) {
      toast.error('Wallet not available', {
        description: 'Please install MetaMask or another Web3 wallet'
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request account access
      if (!window.ethereum) {
        throw new Error('No wallet found');
      }
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Get current chain
      const chainId = await window.ethereum!.request({ method: 'eth_chainId' });
      const networkInfo = getNetworkInfo(chainId);

      setState({
        isConnected: true,
        address: accounts[0],
        chainId,
        networkName: networkInfo?.chainName || 'Unknown',
        isCorrectNetwork: isCorrectNetwork(chainId),
        isLoading: false,
        error: null,
      });

      toast.success('Wallet connected!', {
        description: `Connected to ${networkInfo?.chainName || 'Unknown Network'}`
      });

    } catch (error: any) {
      console.error('Wallet connection error:', error);
      const errorMessage = error.message || 'Failed to connect wallet';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast.error('Connection failed', {
        description: errorMessage
      });
    }
  }, [isWalletAvailable]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      address: null,
      chainId: null,
      networkName: null,
      isCorrectNetwork: false,
      isLoading: false,
      error: null,
    });
    toast.success('Wallet disconnected');
  }, []);

  // Switch to correct network
  const switchNetwork = useCallback(async () => {
    if (!isWalletAvailable || !state.isConnected) return;

    const targetNetwork = WALLET_CONFIG.NETWORKS[WALLET_CONFIG.DEFAULT_NETWORK];

    try {
      await window.ethereum!.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetNetwork.chainId }],
      });
    } catch (error: any) {
      // If network doesn't exist, add it
      if (error.code === 4902) {
        await addNetwork();
      } else {
        throw error;
      }
    }
  }, [isWalletAvailable, state.isConnected]);

  // Add network to wallet
  const addNetwork = useCallback(async () => {
    if (!isWalletAvailable) return;

    const targetNetwork = WALLET_CONFIG.NETWORKS[WALLET_CONFIG.DEFAULT_NETWORK];

    try {
      await window.ethereum!.request({
        method: 'wallet_addEthereumChain',
        params: [targetNetwork],
      });
    } catch (error: any) {
      console.error('Add network error:', error);
      throw new Error('Failed to add network to wallet');
    }
  }, [isWalletAvailable]);

  return {
    ...state,
    connect,
    disconnect,
    switchNetwork,
    addNetwork,
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}
