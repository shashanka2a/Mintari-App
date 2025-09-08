import { GetServerSideProps } from 'next';
import { prisma } from '../../lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/card';
import { Badge } from '../../src/components/ui/badge';
import { Button } from '../../src/components/ui/button';
import { Share2, Calendar, Image, Palette } from 'lucide-react';
import { ImageWithFallback } from '../../src/components/figma/ImageWithFallback';

interface PublicCollectionPageProps {
  collection: {
    id: string;
    title: string;
    description?: string;
    style: string;
    createdAt: string;
    assets: Array<{
      id: string;
      url: string;
      prompt: string;
      seed?: number;
      model?: string;
      generationTimeMs?: number;
      createdAt: string;
    }>;
    _count: {
      assets: number;
    };
  } | null;
  error?: string;
}

export default function PublicCollectionPage({ collection, error }: PublicCollectionPageProps) {
  if (error || !collection) {
    return (
      <div className="min-h-screen bg-gradient-pastel flex items-center justify-center p-4">
        <Card className="bg-white/90 backdrop-blur-sm border-mintari-lav shadow-vibrant rounded-2xl max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h1 className="text-xl font-semibold text-mintari-ink mb-2">Collection Not Found</h1>
            <p className="text-mintari-ink/70">
              {error || 'This collection may be private or no longer exists.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatGenerationTime = (ms?: number) => {
    if (!ms) return null;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-pastel">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-mintari-lav shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-mintari-ink">
                  {collection.title}
                </h1>
                <p className="text-mintari-ink/70">
                  A public collection by a Mintari artist
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                // You could add a toast notification here
              }}
              className="bg-white/90 border-mintari-lav text-mintari-ink hover:bg-mintari-lav/60"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Collection Info */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Card className="bg-white/90 backdrop-blur-sm border-mintari-lav shadow-vibrant rounded-2xl mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Badge className="bg-pink/20 border-pink/40 text-pink-dark">
                <Palette className="w-3 h-3 mr-1" />
                {collection.style}
              </Badge>
              <Badge className="bg-sky/20 border-sky/40 text-sky-dark">
                <Image className="w-3 h-3 mr-1" />
                {collection._count.assets} images
              </Badge>
              <Badge className="bg-peach/20 border-peach/40 text-peach-dark">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(collection.createdAt)}
              </Badge>
            </div>
            
            {collection.description && (
              <p className="text-mintari-ink/80 leading-relaxed">
                {collection.description}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Assets Grid */}
        {collection.assets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {collection.assets.map((asset) => (
              <Card key={asset.id} className="bg-white/90 backdrop-blur-sm border-mintari-lav shadow-vibrant rounded-2xl overflow-hidden hover:scale-105 transition-all duration-200">
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="w-full h-48 relative">
                    <ImageWithFallback
                      src={asset.url}
                      alt={asset.prompt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Asset Info */}
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-mintari-ink/80 line-clamp-2">
                      {asset.prompt}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-mintari-ink/60">
                      <div className="flex items-center gap-2">
                        {asset.model && (
                          <span className="bg-mintari-lav/20 px-2 py-1 rounded">
                            {asset.model}
                          </span>
                        )}
                        {asset.seed && (
                          <span className="bg-mintari-lav/20 px-2 py-1 rounded">
                            Seed: {asset.seed}
                          </span>
                        )}
                      </div>
                      {formatGenerationTime(asset.generationTimeMs) && (
                        <span className="text-mintari-ink/50">
                          {formatGenerationTime(asset.generationTimeMs)}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white/90 backdrop-blur-sm border-mintari-lav shadow-vibrant rounded-2xl">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-mintari-lav/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Image className="w-8 h-8 text-mintari-lav" />
              </div>
              <h3 className="text-lg font-semibold text-mintari-ink mb-2">No images yet</h3>
              <p className="text-mintari-ink/70">
                This collection doesn't have any images yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-mintari-lav mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 bg-pink rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="font-medium text-mintari-ink">Mintari</span>
          </div>
          <p className="text-mintari-ink/60 text-sm">
            Create magical AI art with Studio Ghibli style
          </p>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  try {
    const { slug } = params!;

    if (!slug || typeof slug !== 'string') {
      return {
        props: {
          collection: null,
          error: 'Invalid collection link',
        },
      };
    }

    // Find collection by public slug
    const collection = await prisma.collection.findUnique({
      where: {
        publicSlug: slug,
        isPublic: true,
      },
      include: {
        assets: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            assets: true,
          },
        },
      },
    });

    if (!collection) {
      return {
        props: {
          collection: null,
          error: 'Collection not found or is private',
        },
      };
    }

    return {
      props: {
        collection: {
          id: collection.id,
          title: collection.title,
          description: collection.description,
          style: collection.style,
          createdAt: collection.createdAt.toISOString(),
          assets: collection.assets.map(asset => ({
            id: asset.id,
            url: asset.url,
            prompt: asset.prompt,
            seed: asset.seed,
            model: asset.model,
            generationTimeMs: asset.generationTimeMs,
            createdAt: asset.createdAt.toISOString(),
          })),
          _count: collection._count,
        },
      },
    };

  } catch (error) {
    console.error('Public collection page error:', error);
    return {
      props: {
        collection: null,
        error: 'Failed to load collection',
      },
    };
  } finally {
    await prisma.$disconnect();
  }
};
