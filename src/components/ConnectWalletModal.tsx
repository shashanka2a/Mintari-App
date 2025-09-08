import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Wallet, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { WALLET_CONFIG } from '../../lib/config/wallet';

interface ConnectWalletModalProps {
  children: React.ReactNode;
  onConnect?: () => void;
}

export default function ConnectWalletModal({ children, onConnect }: ConnectWalletModalProps) {
  const {
    isConnected,
    address,
    networkName,
    isCorrectNetwork,
    isLoading,
    error,
    connect,
    disconnect,
    switchNetwork,
  } = useWallet();

  const handleConnect = async () => {
    await connect();
    if (onConnect) onConnect();
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchNetwork();
    } catch (error) {
      console.error('Network switch failed:', error);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      // You could add a toast notification here
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="bg-white/95 backdrop-blur-sm border-mintari-lav shadow-vibrant max-w-md">
        <DialogHeader>
          <DialogTitle className="text-mintari-ink text-center">
            {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isConnected ? (
            <>
              {/* Connection Section */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-pink/30 to-lavender/30 rounded-full flex items-center justify-center mx-auto">
                  <Wallet className="w-8 h-8 text-mintari-ink" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-mintari-ink mb-2">
                    Connect Your Wallet
                  </h3>
                  <p className="text-mintari-ink/70 text-sm">
                    Connect your wallet to mint NFTs and manage your digital art collection.
                  </p>
                </div>

                {/* Supported Networks */}
                <div className="space-y-2">
                  <p className="text-xs text-mintari-ink/60 font-medium">Supported Networks:</p>
                  <div className="flex gap-2 justify-center">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      Base Sepolia
                    </Badge>
                    <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                      Sepolia
                    </Badge>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {/* Connect Button */}
                <Button
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="w-full bg-pink-dark hover:bg-pink text-white shadow-vibrant hover:scale-105 transition-all"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect Wallet
                    </>
                  )}
                </Button>
              </div>

              {/* Wallet Requirements */}
              <Card className="bg-mintari-lav/10 border-mintari-lav/20">
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium text-mintari-ink mb-2">
                    Wallet Requirements:
                  </h4>
                  <ul className="text-xs text-mintari-ink/70 space-y-1">
                    <li>• MetaMask or compatible Web3 wallet</li>
                    <li>• Testnet ETH for gas fees</li>
                    <li>• Base Sepolia or Sepolia network</li>
                  </ul>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Connected State */}
              <div className="space-y-4">
                {/* Connection Status */}
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">Wallet Connected</span>
                </div>

                {/* Address */}
                <Card className="bg-mintari-lav/10 border-mintari-lav/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-mintari-ink/60 mb-1">Address</p>
                        <p className="font-mono text-sm text-mintari-ink">
                          {formatAddress(address!)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyAddress}
                        className="bg-white/90 border-mintari-lav text-mintari-ink hover:bg-mintari-lav/60"
                      >
                        Copy
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Network Status */}
                <Card className={`border ${isCorrectNetwork ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-mintari-ink/60 mb-1">Network</p>
                        <p className="text-sm font-medium text-mintari-ink">
                          {networkName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCorrectNetwork ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Network Switch */}
                {!isCorrectNetwork && (
                  <Button
                    onClick={handleSwitchNetwork}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                  >
                    Switch to {WALLET_CONFIG.NETWORKS[WALLET_CONFIG.DEFAULT_NETWORK].chainName}
                  </Button>
                )}

                {/* Explorer Link */}
                {address && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const explorerUrl = isCorrectNetwork 
                        ? `https://sepolia.basescan.org/address/${address}`
                        : `https://etherscan.io/address/${address}`;
                      window.open(explorerUrl, '_blank');
                    }}
                    className="w-full bg-white/90 border-mintari-lav text-mintari-ink hover:bg-mintari-lav/60"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Explorer
                  </Button>
                )}

                {/* Disconnect */}
                <Button
                  variant="outline"
                  onClick={disconnect}
                  className="w-full bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                >
                  Disconnect Wallet
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
