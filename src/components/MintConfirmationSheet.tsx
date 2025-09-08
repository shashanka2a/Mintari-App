import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Coins, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Asset {
  id: string;
  url: string;
  prompt: string;
  seed?: number;
  model?: string;
  generationTimeMs?: number;
  createdAt: string;
}

interface MintConfirmationSheetProps {
  children: React.ReactNode;
  assets: Asset[];
  userAddress: string;
  userId: string;
  onMintSuccess?: (transactionHashes: string[]) => void;
}

interface MintResult {
  success: boolean;
  transactionHashes?: string[];
  error?: string;
}

export default function MintConfirmationSheet({
  children,
  assets,
  userAddress,
  userId,
  onMintSuccess
}: MintConfirmationSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState<MintResult | null>(null);

  const handleMint = async () => {
    if (assets.length === 0) {
      toast.error('No assets selected for minting');
      return;
    }

    setIsMinting(true);
    setMintResult(null);

    try {
      const response = await fetch('/api/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetIds: assets.map(asset => asset.id),
          userAddress,
          userId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMintResult({
          success: true,
          transactionHashes: data.transactionHashes,
        });
        
        toast.success('NFTs minted successfully!', {
          description: `${assets.length} NFTs have been minted to your wallet`
        });

        if (onMintSuccess) {
          onMintSuccess(data.transactionHashes);
        }
      } else {
        setMintResult({
          success: false,
          error: data.error || 'Minting failed',
        });
        
        toast.error('Minting failed', {
          description: data.error || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('Mint error:', error);
      setMintResult({
        success: false,
        error: 'Network error occurred',
      });
      
      toast.error('Minting failed', {
        description: 'Network error occurred'
      });
    } finally {
      setIsMinting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatGenerationTime = (ms?: number) => {
    if (!ms) return null;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getExplorerUrl = (txHash: string) => {
    // Base Sepolia explorer
    return `https://sepolia.basescan.org/tx/${txHash}`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="bg-white/95 backdrop-blur-sm border-mintari-lav shadow-vibrant w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-mintari-ink">
            {mintResult?.success ? 'Minting Complete!' : 'Confirm NFT Minting'}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {!mintResult ? (
            <>
              {/* Pre-mint confirmation */}
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink/30 to-lavender/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Coins className="w-8 h-8 text-mintari-ink" />
                  </div>
                  <h3 className="text-lg font-semibold text-mintari-ink mb-2">
                    Mint {assets.length} NFT{assets.length !== 1 ? 's' : ''}
                  </h3>
                  <p className="text-mintari-ink/70 text-sm">
                    These assets will be minted as NFTs on the blockchain
                  </p>
                </div>

                {/* Assets preview */}
                <div className="space-y-3">
                  <h4 className="font-medium text-mintari-ink">Assets to mint:</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {assets.map((asset) => (
                      <Card key={asset.id} className="bg-mintari-lav/10 border-mintari-lav/20">
                        <CardContent className="p-3">
                          <div className="flex gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                              <ImageWithFallback
                                src={asset.url}
                                alt={asset.prompt}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-mintari-ink line-clamp-2">
                                {asset.prompt}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {asset.model && (
                                  <Badge className="bg-mintari-lav/20 text-mintari-ink text-xs">
                                    {asset.model}
                                  </Badge>
                                )}
                                {asset.seed && (
                                  <Badge className="bg-mintari-lav/20 text-mintari-ink text-xs">
                                    Seed: {asset.seed}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Minting info */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Minting Details</h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div className="flex justify-between">
                        <span>Network:</span>
                        <span>Base Sepolia (Testnet)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gas Fees:</span>
                        <span>≈ $0 (Testnet)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Contract:</span>
                        <span className="font-mono text-xs">ERC-1155 Edition</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Recipient:</span>
                        <span className="font-mono text-xs">
                          {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleMint}
                    disabled={isMinting}
                    className="flex-1 bg-pink-dark hover:bg-pink text-white shadow-vibrant hover:scale-105 transition-all"
                  >
                    {isMinting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Minting...
                      </>
                    ) : (
                      <>
                        <Coins className="w-4 h-4 mr-2" />
                        Mint NFTs
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    disabled={isMinting}
                    className="flex-1 bg-white/90 border-mintari-lav text-mintari-ink hover:bg-mintari-lav/60"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          ) : mintResult.success ? (
            <>
              {/* Success state */}
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Minting Successful!
                  </h3>
                  <p className="text-green-700 text-sm">
                    {assets.length} NFT{assets.length !== 1 ? 's' : ''} have been minted to your wallet
                  </p>
                </div>

                {/* Transaction hashes */}
                <div className="space-y-3">
                  <h4 className="font-medium text-mintari-ink">Transaction Details:</h4>
                  <div className="space-y-2">
                    {mintResult.transactionHashes?.map((txHash, index) => (
                      <Card key={txHash} className="bg-mintari-lav/10 border-mintari-lav/20">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-mintari-ink">
                                NFT #{index + 1}
                              </p>
                              <p className="text-xs text-mintari-ink/60 font-mono">
                                {txHash.slice(0, 10)}...{txHash.slice(-8)}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(getExplorerUrl(txHash), '_blank')}
                              className="bg-white/90 border-mintari-lav text-mintari-ink hover:bg-mintari-lav/60"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setIsOpen(false);
                      setMintResult(null);
                    }}
                    className="flex-1 bg-pink-dark hover:bg-pink text-white shadow-vibrant hover:scale-105 transition-all"
                  >
                    Done
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const explorerUrl = `https://sepolia.basescan.org/address/${userAddress}`;
                      window.open(explorerUrl, '_blank');
                    }}
                    className="flex-1 bg-white/90 border-mintari-lav text-mintari-ink hover:bg-mintari-lav/60"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Wallet
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Error state */}
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">
                    Minting Failed
                  </h3>
                  <p className="text-red-700 text-sm">
                    {mintResult.error || 'An unknown error occurred'}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setMintResult(null);
                    }}
                    className="flex-1 bg-pink-dark hover:bg-pink text-white shadow-vibrant hover:scale-105 transition-all"
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 bg-white/90 border-mintari-lav text-mintari-ink hover:bg-mintari-lav/60"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
