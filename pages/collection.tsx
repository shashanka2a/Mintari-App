import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '../src/components/ui/card';
import { Button } from '../src/components/ui/button';
import { Badge } from '../src/components/ui/badge';
import { Input } from '../src/components/ui/input';
import { Label } from '../src/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../src/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../src/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../src/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Share2, Calendar, Image, Palette, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface Collection {
  id: string;
  title: string;
  description?: string;
  style: string;
  isPublic: boolean;
  publicSlug?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    items: number;
    assets: number;
  };
}

export default function CollectionPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    style: 'ghibli',
    isPublic: false,
  });

  const userId = 'demo-user-123'; // In a real app, this would come from auth

  // Load collections
  useEffect(() => {
    loadCollections();
  }, [selectedStyle]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        userId,
        ...(selectedStyle !== 'all' && { style: selectedStyle }),
      });

      const response = await fetch(`/api/collections?${params}`);
      const data = await response.json();

      if (response.ok) {
        setCollections(data);
      } else {
        toast.error('Failed to load collections', {
          description: data.error || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('Load collections error:', error);
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Collection created successfully!');
        setShowCreateDialog(false);
        setFormData({ title: '', description: '', style: 'ghibli', isPublic: false });
        loadCollections();
      } else {
        toast.error('Failed to create collection', {
          description: data.error || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('Create collection error:', error);
      toast.error('Failed to create collection');
    }
  };

  const handleUpdateCollection = async () => {
    if (!editingCollection) return;

    try {
      const response = await fetch(`/api/collections/${editingCollection.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Collection updated successfully!');
        setShowEditDialog(false);
        setEditingCollection(null);
        setFormData({ title: '', description: '', style: 'ghibli', isPublic: false });
        loadCollections();
      } else {
        toast.error('Failed to update collection', {
          description: data.error || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('Update collection error:', error);
      toast.error('Failed to update collection');
    }
  };

  const handleDeleteCollection = async () => {
    if (!deletingCollection) return;

    try {
      const response = await fetch(`/api/collections/${deletingCollection.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        toast.success('Collection deleted successfully!');
        setDeletingCollection(null);
        loadCollections();
      } else {
        const data = await response.json();
        toast.error('Failed to delete collection', {
          description: data.error || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('Delete collection error:', error);
      toast.error('Failed to delete collection');
    }
  };

  const handleShareCollection = (collection: Collection) => {
    if (collection.isPublic && collection.publicSlug) {
      const shareUrl = `${window.location.origin}/c/${collection.publicSlug}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
    } else {
      toast.error('Collection must be public to share');
    }
  };

  const openEditDialog = (collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      title: collection.title,
      description: collection.description || '',
      style: collection.style,
      isPublic: collection.isPublic,
    });
    setShowEditDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredCollections = collections.filter(collection => 
    selectedStyle === 'all' || collection.style === selectedStyle
  );

  return (
    <div className="min-h-screen bg-gradient-pastel">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-mintari-lav shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-mintari-ink mb-2">
                My Collections
              </h1>
              <p className="text-mintari-ink/70">
                Organize and share your magical AI creations
              </p>
            </div>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-pink-dark hover:bg-pink text-white shadow-vibrant hover:scale-105 transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  New Collection
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white/95 backdrop-blur-sm border-mintari-lav shadow-vibrant">
                <DialogHeader>
                  <DialogTitle className="text-mintari-ink">Create New Collection</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-mintari-ink">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="My Magical Collection"
                      className="bg-white/90 border-mintari-lav"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-mintari-ink">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="A collection of my favorite Ghibli-style art"
                      className="bg-white/90 border-mintari-lav"
                    />
                  </div>
                  <div>
                    <Label htmlFor="style" className="text-mintari-ink">Style</Label>
                    <Select value={formData.style} onValueChange={(value) => setFormData({ ...formData, style: value })}>
                      <SelectTrigger className="bg-white/90 border-mintari-lav">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ghibli">Studio Ghibli</SelectItem>
                        <SelectItem value="anime">Anime</SelectItem>
                        <SelectItem value="fantasy">Fantasy</SelectItem>
                        <SelectItem value="whimsical">Whimsical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                      className="rounded border-mintari-lav"
                    />
                    <Label htmlFor="isPublic" className="text-mintari-ink">Make public (shareable)</Label>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleCreateCollection}
                      className="flex-1 bg-pink-dark hover:bg-pink text-white"
                    >
                      Create Collection
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                      className="flex-1 bg-white/90 border-mintari-lav text-mintari-ink"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Label className="text-mintari-ink font-medium">Filter by style:</Label>
          <Select value={selectedStyle} onValueChange={setSelectedStyle}>
            <SelectTrigger className="w-48 bg-white/90 border-mintari-lav">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Styles</SelectItem>
              <SelectItem value="ghibli">Studio Ghibli</SelectItem>
              <SelectItem value="anime">Anime</SelectItem>
              <SelectItem value="fantasy">Fantasy</SelectItem>
              <SelectItem value="whimsical">Whimsical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Collections Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, i) => (
              <Card key={i} className="bg-white/90 backdrop-blur-sm border-mintari-lav shadow-vibrant rounded-2xl">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-mintari-lav/20 rounded w-3/4"></div>
                    <div className="h-3 bg-mintari-lav/20 rounded w-1/2"></div>
                    <div className="h-3 bg-mintari-lav/20 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCollections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCollections.map((collection) => (
              <Card key={collection.id} className="bg-white/90 backdrop-blur-sm border-mintari-lav shadow-vibrant rounded-2xl hover:scale-105 transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-mintari-ink mb-1">
                        {collection.title}
                      </CardTitle>
                      {collection.description && (
                        <p className="text-sm text-mintari-ink/70 line-clamp-2">
                          {collection.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {collection.isPublic ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-mintari-ink/40" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className="bg-pink/20 border-pink/40 text-pink-dark">
                      <Palette className="w-3 h-3 mr-1" />
                      {collection.style}
                    </Badge>
                    <Badge className="bg-sky/20 border-sky/40 text-sky-dark">
                      <Image className="w-3 h-3 mr-1" />
                      {collection._count.assets} images
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-mintari-ink/60 mb-4">
                    <Calendar className="w-3 h-3" />
                    Created {formatDate(collection.createdAt)}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(collection)}
                      className="flex-1 bg-white/90 border-mintari-lav text-mintari-ink hover:bg-mintari-lav/60"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShareCollection(collection)}
                      className="flex-1 bg-white/90 border-mintari-lav text-mintari-ink hover:bg-mintari-lav/60"
                    >
                      <Share2 className="w-3 h-3 mr-1" />
                      Share
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white/95 backdrop-blur-sm border-mintari-lav shadow-vibrant">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-mintari-ink">Delete Collection</AlertDialogTitle>
                          <AlertDialogDescription className="text-mintari-ink/70">
                            Are you sure you want to delete "{collection.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-white/90 border-mintari-lav text-mintari-ink">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              setDeletingCollection(collection);
                              handleDeleteCollection();
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
              <h3 className="text-lg font-semibold text-mintari-ink mb-2">No collections yet</h3>
              <p className="text-mintari-ink/70 mb-6">
                Create your first collection to organize your magical AI creations.
              </p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-pink-dark hover:bg-pink text-white shadow-vibrant hover:scale-105 transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Collection
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-white/95 backdrop-blur-sm border-mintari-lav shadow-vibrant">
          <DialogHeader>
            <DialogTitle className="text-mintari-ink">Edit Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title" className="text-mintari-ink">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="My Magical Collection"
                className="bg-white/90 border-mintari-lav"
              />
            </div>
            <div>
              <Label htmlFor="edit-description" className="text-mintari-ink">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="A collection of my favorite Ghibli-style art"
                className="bg-white/90 border-mintari-lav"
              />
            </div>
            <div>
              <Label htmlFor="edit-style" className="text-mintari-ink">Style</Label>
              <Select value={formData.style} onValueChange={(value) => setFormData({ ...formData, style: value })}>
                <SelectTrigger className="bg-white/90 border-mintari-lav">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ghibli">Studio Ghibli</SelectItem>
                  <SelectItem value="anime">Anime</SelectItem>
                  <SelectItem value="fantasy">Fantasy</SelectItem>
                  <SelectItem value="whimsical">Whimsical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-isPublic"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="rounded border-mintari-lav"
              />
              <Label htmlFor="edit-isPublic" className="text-mintari-ink">Make public (shareable)</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleUpdateCollection}
                className="flex-1 bg-pink-dark hover:bg-pink text-white"
              >
                Update Collection
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="flex-1 bg-white/90 border-mintari-lav text-mintari-ink"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
