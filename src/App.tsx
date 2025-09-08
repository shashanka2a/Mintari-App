import React, { useState, useEffect } from 'react';
import { ChevronLeft, Home, Upload, Palette, Library, Coins, ShoppingCart, Image, Plus, Trash2, RefreshCw, Save, Heart, Wallet, CreditCard, CheckCircle } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { Sparkle } from './components/Sparkle';
import exampleImage from './assets/aa07ce0034f6e4c889b68c05b1a06f573c134512.png';

type Screen = 'home' | 'upload' | 'generation' | 'collection' | 'nft-mint' | 'checkout' | 'gallery';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedFrames, setGeneratedFrames] = useState<string[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentTooltip, setCurrentTooltip] = useState(0);
  const [collection, setCollection] = useState([
    {
      id: 1,
      title: "Magical Forest",
      date: "Dec 3, 2024",
      originalImage: "https://images.unsplash.com/photo-1618298363483-e31a31f1a1e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHBob3RvZ3JhcGh5JTIwcGVyc29uJTIwc21pbGluZ3xlbnwxfHx8fDE3NTcyODk1Mjh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      ghibliFrame: "https://images.unsplash.com/photo-1610114586897-20495783e96c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkaW8lMjBnaGlibGklMjBhbmltZSUyMHN0eWxlJTIwbGFuZHNjYXBlfGVufDF8fHx8MTc1NzI4OTUyNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    }
  ]);

  // Load saved state from localStorage on component mount
  useEffect(() => {
    const savedUploadedImage = localStorage.getItem('mintari-uploaded-image');
    const savedGeneratedFrames = localStorage.getItem('mintari-generated-frames');
    const savedSelectedFrame = localStorage.getItem('mintari-selected-frame');
    const savedCollection = localStorage.getItem('mintari-collection');
    const hasSeenOnboarding = localStorage.getItem('mintari-onboarding-seen');

    if (savedUploadedImage) {
      setUploadedImage(savedUploadedImage);
    }
    if (savedGeneratedFrames) {
      try {
        setGeneratedFrames(JSON.parse(savedGeneratedFrames));
      } catch (e) {
        console.error('Failed to parse saved generated frames');
      }
    }
    if (savedSelectedFrame) {
      setSelectedFrame(savedSelectedFrame);
    }
    if (savedCollection) {
      try {
        setCollection(JSON.parse(savedCollection));
      } catch (e) {
        console.error('Failed to parse saved collection');
      }
    }

    // Show onboarding for first-time users
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (uploadedImage) {
      localStorage.setItem('mintari-uploaded-image', uploadedImage);
    } else {
      localStorage.removeItem('mintari-uploaded-image');
    }
  }, [uploadedImage]);

  useEffect(() => {
    if (generatedFrames.length > 0) {
      localStorage.setItem('mintari-generated-frames', JSON.stringify(generatedFrames));
    } else {
      localStorage.removeItem('mintari-generated-frames');
    }
  }, [generatedFrames]);

  useEffect(() => {
    if (selectedFrame) {
      localStorage.setItem('mintari-selected-frame', selectedFrame);
    } else {
      localStorage.removeItem('mintari-selected-frame');
    }
  }, [selectedFrame]);

  useEffect(() => {
    localStorage.setItem('mintari-collection', JSON.stringify(collection));
  }, [collection]);

  const navigate = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const goBack = () => {
    switch (currentScreen) {
      case 'upload':
      case 'collection':
      case 'gallery':
        navigate('home');
        break;
      case 'generation':
        navigate('upload');
        break;
      case 'nft-mint':
      case 'checkout':
        navigate('generation');
        break;
      default:
        navigate('home');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous errors
    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file (JPG, PNG, GIF, etc.)");
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("File too large. Please choose an image under 10MB.");
      return;
    }

    // Validate minimum size (100KB)
    const minSize = 100 * 1024; // 100KB
    if (file.size < minSize) {
      setError("File too small. Please choose a higher quality image.");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setError(null);
      };
      reader.onerror = () => {
        setError("Failed to read the image file. Please try again.");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("An error occurred while processing the image. Please try again.");
    }
  };

  const generateGhibliFrames = async () => {
    if (!uploadedImage) {
      setError("Please upload an image first");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);

    try {
      // Simulate AI generation with progress updates
      const progressSteps = [
        { progress: 20, message: "Analyzing your photo..." },
        { progress: 40, message: "Applying Ghibli magic..." },
        { progress: 60, message: "Creating artistic variations..." },
        { progress: 80, message: "Adding final touches..." },
        { progress: 100, message: "Complete!" }
      ];

      for (const step of progressSteps) {
        setGenerationProgress(step.progress);
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate processing time
      }

      // Mock AI generation results
      const mockFrames = [
        "https://images.unsplash.com/photo-1610114586897-20495783e96c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkaW8lMjBnaGlibGklMjBhbmltZSUyMHN0eWxlJTIwbGFuZHNjYXBlfGVufDF8fHx8MTc1NzI4OTUyNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1610114586897-20495783e96c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkaW8lMjBnaGlibGklMjBhbmltZSUyMHN0eWxlJTIwbGFuZHNjYXBlfGVufDF8fHx8MTc1NzI4OTUyNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1610114586897-20495783e96c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkaW8lMjBnaGlibGklMjBhbmltZSUyMHN0eWxlJTIwbGFuZHNjYXBlfGVufDF8fHx8MTc1NzI4OTUyNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
      ];
      
      setGeneratedFrames(mockFrames);
      navigate('generation');
    } catch (err) {
      setError("Failed to generate Ghibli art. Please try again.");
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const addToCollection = () => {
    if (selectedFrame && uploadedImage) {
      const newItem = {
        id: collection.length + 1,
        title: `Ghibli Moment ${collection.length + 1}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        originalImage: uploadedImage,
        ghibliFrame: selectedFrame
      };
      setCollection([...collection, newItem]);
    }
  };

  const onboardingTooltips = [
    {
      title: "Welcome to Mintari! ✨",
      message: "Transform your photos into magical Ghibli-style artwork. Let's get started!",
      position: "center"
    },
    {
      title: "Upload Your Photo",
      message: "Click here to upload a photo you'd like to transform into Ghibli art.",
      position: "bottom"
    },
    {
      title: "Generate Magic",
      message: "Once uploaded, click 'Generate Ghibli Art' to create your magical transformation.",
      position: "top"
    },
    {
      title: "Save & Share",
      message: "Save your favorite creations to your collection or share them with friends!",
      position: "top"
    }
  ];

  const nextTooltip = () => {
    if (currentTooltip < onboardingTooltips.length - 1) {
      setCurrentTooltip(currentTooltip + 1);
    } else {
      setShowOnboarding(false);
      localStorage.setItem('mintari-onboarding-seen', 'true');
    }
  };

  const skipOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('mintari-onboarding-seen', 'true');
  };

  const renderHeader = () => {
    if (currentScreen === 'home') return null;
    
    return (
      <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b border-mintari-lav">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={goBack}
          className="text-mintari-ink hover:bg-mintari-lav/50"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-mintari-ink font-display font-medium">
          {currentScreen === 'upload' && 'Upload Photo'}
          {currentScreen === 'generation' && 'AI Generation'}
          {currentScreen === 'collection' && 'My Collection'}
          {currentScreen === 'nft-mint' && 'Mint NFT'}
          {currentScreen === 'checkout' && 'Order Frame'}
          {currentScreen === 'gallery' && 'Gallery'}
        </h1>
        <div className="w-16" />
      </div>
    );
  };

  const renderOnboardingOverlay = () => {
    if (!showOnboarding) return null;

    const tooltip = onboardingTooltips[currentTooltip];
    
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-soft max-w-sm mx-auto p-6 relative">
          <div className="text-center">
            <h3 className="font-display text-xl font-bold text-mintari-ink mb-3">
              {tooltip.title}
            </h3>
            <p className="text-mintari-ink/70 mb-6">
              {tooltip.message}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={skipOnboarding}
                className="text-mintari-ink border-mintari-lav hover:bg-mintari-lav/50"
              >
                Skip
              </Button>
              <Button
                onClick={nextTooltip}
                className="bg-pink text-white hover:bg-pink/90"
              >
                {currentTooltip === onboardingTooltips.length - 1 ? 'Get Started' : 'Next'}
              </Button>
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {onboardingTooltips.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentTooltip ? 'bg-pink' : 'bg-mintari-lav'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHomeScreen = () => (
    <div className="min-h-screen bg-soft">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-pink rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-medium text-mintari-ink">Mintari</span>
        </div>
        <Button variant="outline" size="sm" className="bg-white/80 border-mintari-lav text-mintari-ink hover:bg-white">
          Sign In
        </Button>
      </div>

      {/* Hero Section */}
      <div className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-mintari p-8 rounded-2xl shadow-soft relative overflow-hidden">
            {/* Sparkles */}
            <Sparkle className="top-4 left-8" delay={0} />
            <Sparkle className="top-12 right-12" delay={500} />
            <Sparkle className="bottom-8 left-16" delay={1000} />
            
            <div className="text-center relative z-10">
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 text-white">
                Mint Your Ghibli Moments ✨
              </h1>
              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                Transform your precious photos into beautiful AI-generated storybooks and custom frames. Turn memories into magical masterpieces.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-12">
                <Button 
                  size="lg" 
                  onClick={() => navigate('upload')}
                  className="bg-pink text-white rounded-2xl px-6 py-3 shadow-soft hover:bg-pink/90 focus:ring-2 focus:ring-pink/50 focus:outline-none"
                  aria-label="Start creating your Ghibli art"
                >
                  Start Creating
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('gallery')}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-2xl focus:ring-2 focus:ring-white/50 focus:outline-none"
                  aria-label="View examples of Ghibli transformations"
                >
                  View Examples
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex justify-center gap-8 mb-16 mt-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-peach rounded-full flex items-center justify-center mb-2 mx-auto shadow-soft">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-mintari-ink">Upload Photo</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-sky rounded-full flex items-center justify-center mb-2 mx-auto shadow-soft">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-mintari-ink">AI Storybook</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-lavender rounded-full flex items-center justify-center mb-2 mx-auto shadow-soft">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-mintari-ink">Custom Frame</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-mintari-lav">
        <div className="flex justify-around py-2">
          <Button variant="ghost" className="flex-col text-mintari-ink hover:bg-mintari-lav/50 py-3" onClick={() => navigate('home')}>
            <Home className="w-5 h-5 mb-1" />
            <span className="text-xs">Home</span>
          </Button>
          <Button variant="ghost" className="flex-col text-mintari-ink hover:bg-mintari-lav/50 py-3" onClick={() => navigate('upload')}>
            <Upload className="w-5 h-5 mb-1" />
            <span className="text-xs">Upload</span>
          </Button>
          <Button variant="ghost" className="flex-col text-mintari-ink hover:bg-mintari-lav/50 py-3" onClick={() => navigate('collection')}>
            <Library className="w-5 h-5 mb-1" />
            <span className="text-xs">Collection</span>
          </Button>
          <Button variant="ghost" className="flex-col text-mintari-ink hover:bg-mintari-lav/50 py-3" onClick={() => navigate('gallery')}>
            <Image className="w-5 h-5 mb-1" />
            <span className="text-xs">Gallery</span>
          </Button>
        </div>
      </div>
    </div>
  );

  const renderLoadingScreen = () => (
    <div className="min-h-screen bg-soft flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="bg-mintari p-8 rounded-2xl shadow-soft">
          <div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-6"></div>
          <h2 className="text-2xl font-display font-bold text-white mb-4">Creating Magic</h2>
          <p className="text-white/90 mb-6">
            {generationProgress < 20 && "Analyzing your photo..."}
            {generationProgress >= 20 && generationProgress < 40 && "Applying Ghibli magic..."}
            {generationProgress >= 40 && generationProgress < 60 && "Creating artistic variations..."}
            {generationProgress >= 60 && generationProgress < 80 && "Adding final touches..."}
            {generationProgress >= 80 && "Almost done!"}
          </p>
          <div className="w-full bg-white/20 rounded-full h-2 mb-4">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${generationProgress}%` }}
            ></div>
          </div>
          <p className="text-white/70 text-sm">{generationProgress}% complete</p>
        </div>
      </div>
    </div>
  );

  const renderUploadScreen = () => {
    if (isGenerating) {
      return renderLoadingScreen();
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400">
        {renderHeader()}
        
        <div className="p-4 pb-20">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Upload Your Photo</h2>
          
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
              <p className="text-red-100 text-sm text-center">{error}</p>
            </div>
          )}
          
          {!uploadedImage ? (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-8 text-center">
                <label 
                  htmlFor="photo-upload" 
                  className="cursor-pointer focus-within:ring-2 focus-within:ring-white/50 focus-within:outline-none rounded-lg p-2 block"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      document.getElementById('photo-upload')?.click();
                    }
                  }}
                >
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-12 h-12 text-white" />
                  </div>
                  <p className="text-white mb-2">Tap to upload a photo</p>
                  <p className="text-white/70 text-sm">JPG, PNG up to 10MB</p>
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  aria-label="Upload photo for Ghibli transformation"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <ImageWithFallback 
                    src={uploadedImage} 
                    alt="Uploaded photo" 
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </CardContent>
              </Card>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setUploadedImage(null)}
                  className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
                <Button 
                  onClick={generateGhibliFrames}
                  disabled={isGenerating}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white border-0 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Generating...
                    </div>
                  ) : (
                    "Generate Ghibli Art"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    );
  };

  const renderGenerationScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400">
      {renderHeader()}
      
      <div className="p-4 pb-20">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Your Ghibli Moments</h2>
          
          <div className="space-y-4 mb-6">
            {generatedFrames.map((frame, index) => (
              <Card 
                key={index} 
                className={`bg-white/10 backdrop-blur-sm border-white/20 cursor-pointer transition-all ${
                  selectedFrame === frame ? 'ring-2 ring-orange-500' : ''
                }`}
                onClick={() => setSelectedFrame(frame)}
              >
                <CardContent className="p-4">
                  <ImageWithFallback 
                    src={frame} 
                    alt={`Ghibli frame ${index + 1}`} 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedFrame && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30"
                  onClick={() => {
                    addToCollection();
                    navigate('collection');
                  }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30"
                  onClick={generateGhibliFrames}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
              </div>
              <Button 
                onClick={() => navigate('nft-mint')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white border-0"
              >
                <Coins className="w-4 h-4 mr-2" />
                Mint as NFT
              </Button>
              <Button 
                onClick={() => navigate('checkout')}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white border-0"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Order Physical Frame
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCollectionScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400">
      {renderHeader()}
      
      <div className="p-4 pb-20">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">My Collection</h2>
          
          <div className="space-y-4">
            {collection.map((item) => (
              <Card key={item.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-lg">{item.title}</CardTitle>
                  <p className="text-white/70 text-sm">{item.date}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-white/70 text-xs mb-1">Original</p>
                      <ImageWithFallback 
                        src={item.originalImage} 
                        alt="Original photo" 
                        className="w-full h-24 object-cover rounded"
                      />
                    </div>
                    <div>
                      <p className="text-white/70 text-xs mb-1">Ghibli Style</p>
                      <ImageWithFallback 
                        src={item.ghibliFrame} 
                        alt="Ghibli frame" 
                        className="w-full h-24 object-cover rounded"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30"
                  >
                    <Heart className="w-3 h-3 mr-1" />
                    Share
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30"
                  >
                    <Coins className="w-3 h-3 mr-1" />
                    Mint NFT
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderNFTMintScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400">
      {renderHeader()}
      
      <div className="p-4 pb-20">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Mint as NFT</h2>
          
          {selectedFrame && (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
              <CardContent className="p-4">
                <ImageWithFallback 
                  src={selectedFrame} 
                  alt="Selected frame" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/70">Mint Price:</span>
                    <span className="text-white font-medium">0.05 ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Gas Fee:</span>
                    <span className="text-white font-medium">~$5.00</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-white">Total:</span>
                    <span className="text-white">0.05 ETH + Gas</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
            <CardContent className="p-4 text-center">
              <Wallet className="w-12 h-12 text-white mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">Connect Your Wallet</h3>
              <p className="text-white/70 text-sm mb-4">
                Connect your wallet to mint this artwork as an NFT on the blockchain
              </p>
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white border-0">
                Connect Wallet
              </Button>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-white/70 text-xs">
              By minting, you agree to our terms of service and confirm ownership of the original photo
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCheckoutScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400">
      {renderHeader()}
      
      <div className="p-4 pb-20">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Order Physical Frame</h2>
          
          {selectedFrame && (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
              <CardContent className="p-4">
                <ImageWithFallback 
                  src={selectedFrame} 
                  alt="Selected frame" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <div className="space-y-3">
                  <div>
                    <h3 className="text-white font-medium mb-2">Frame Options</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                        <div>
                          <p className="text-white font-medium">Premium Wood Frame</p>
                          <p className="text-white/70 text-sm">12" x 16" with matting</p>
                        </div>
                        <Badge className="bg-orange-500">$89</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white font-medium">Metal Frame</p>
                          <p className="text-white/70 text-sm">12" x 16" modern style</p>
                        </div>
                        <Badge variant="outline" className="border-white/30 text-white">$65</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
            <CardContent className="p-4">
              <h3 className="text-white font-medium mb-4">Payment Method</h3>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-white/10 rounded-lg">
                  <CreditCard className="w-5 h-5 text-white mr-3" />
                  <span className="text-white">•••• •••• •••• 4242</span>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  Add Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white border-0">
            <CheckCircle className="w-4 h-4 mr-2" />
            Complete Order - $89
          </Button>
        </div>
      </div>
    </div>
  );

  const renderGalleryScreen = () => (
    <div className="min-h-screen bg-soft">
      {renderHeader()}
      
      <div className="p-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 relative">
            <Sparkle className="top-0 left-1/4" delay={0} />
            <Sparkle className="top-0 right-1/4" delay={500} />
            <h2 className="font-display text-3xl md:text-4xl font-bold text-mintari-ink mb-4">
              Gallery of Transformations
            </h2>
            <p className="text-mintari-ink/70 text-lg">See the magic happen ✨</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {collection.map((item) => (
              <Card key={item.id} className="bg-white/80 backdrop-blur-sm border-mintari-lav shadow-soft">
                <CardHeader>
                  <CardTitle className="text-mintari-ink text-center font-display">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative group">
                    <p className="text-mintari-ink/70 text-sm mb-2 text-center">Hover to see transformation</p>
                    <div className="relative overflow-hidden rounded-xl">
                      {/* Before Image */}
                      <ImageWithFallback 
                        src={item.originalImage} 
                        alt="Before transformation" 
                        className="w-full h-48 object-cover rounded-xl shadow-soft transition-opacity duration-500 group-hover:opacity-0"
                      />
                      {/* After Image */}
                      <ImageWithFallback 
                        src={item.ghibliFrame} 
                        alt="After transformation" 
                        className="absolute inset-0 w-full h-48 object-cover rounded-xl shadow-soft"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="text-center">
                  <p className="text-mintari-ink/70 text-sm w-full">{item.date}</p>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const screens = {
    home: renderHomeScreen,
    upload: renderUploadScreen,
    generation: renderGenerationScreen,
    collection: renderCollectionScreen,
    'nft-mint': renderNFTMintScreen,
    checkout: renderCheckoutScreen,
    gallery: renderGalleryScreen,
  };

  return (
    <>
      {screens[currentScreen]()}
      {renderOnboardingOverlay()}
    </>
  );
}