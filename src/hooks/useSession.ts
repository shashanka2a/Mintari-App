import { useState, useEffect, useCallback } from 'react';

interface UserSession {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  walletAddress?: string;
  isAuthenticated: boolean;
}

interface SessionState {
  user: UserSession | null;
  isLoading: boolean;
  isInitialized: boolean;
}

const SESSION_KEY = 'mintari-session';
const DEMO_USER: UserSession = {
  id: 'demo-user-123',
  email: 'demo@mintari.app',
  username: 'demo_user',
  fullName: 'Demo User',
  avatarUrl: undefined,
  walletAddress: undefined,
  isAuthenticated: true,
};

export function useSession() {
  const [state, setState] = useState<SessionState>({
    user: null,
    isLoading: true,
    isInitialized: false,
  });

  // Initialize session from localStorage
  useEffect(() => {
    const initializeSession = () => {
      try {
        const savedSession = localStorage.getItem(SESSION_KEY);
        
        if (savedSession) {
          const parsedSession = JSON.parse(savedSession);
          setState({
            user: parsedSession,
            isLoading: false,
            isInitialized: true,
          });
        } else {
          // For demo purposes, auto-login with demo user
          setState({
            user: DEMO_USER,
            isLoading: false,
            isInitialized: true,
          });
          // Save demo session
          localStorage.setItem(SESSION_KEY, JSON.stringify(DEMO_USER));
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        // Fallback to demo user
        setState({
          user: DEMO_USER,
          isLoading: false,
          isInitialized: true,
        });
        localStorage.setItem(SESSION_KEY, JSON.stringify(DEMO_USER));
      }
    };

    initializeSession();
  }, []);

  // Login function
  const login = useCallback((userData: Partial<UserSession>) => {
    const user: UserSession = {
      id: userData.id || 'user-' + Date.now(),
      email: userData.email || '',
      username: userData.username,
      fullName: userData.fullName,
      avatarUrl: userData.avatarUrl,
      walletAddress: userData.walletAddress,
      isAuthenticated: true,
    };

    setState({
      user,
      isLoading: false,
      isInitialized: true,
    });

    // Persist to localStorage
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }, []);

  // Logout function
  const logout = useCallback(() => {
    setState({
      user: null,
      isLoading: false,
      isInitialized: true,
    });

    // Clear localStorage
    localStorage.removeItem(SESSION_KEY);
  }, []);

  // Update user data
  const updateUser = useCallback((updates: Partial<UserSession>) => {
    if (!state.user) return;

    const updatedUser = { ...state.user, ...updates };
    
    setState(prev => ({
      ...prev,
      user: updatedUser,
    }));

    // Persist to localStorage
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
  }, [state.user]);

  // Connect wallet
  const connectWallet = useCallback((walletAddress: string) => {
    updateUser({ walletAddress });
  }, [updateUser]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    updateUser({ walletAddress: undefined });
  }, [updateUser]);

  return {
    user: state.user,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    isAuthenticated: state.user?.isAuthenticated || false,
    login,
    logout,
    updateUser,
    connectWallet,
    disconnectWallet,
  };
}
