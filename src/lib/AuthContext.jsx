import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [appPublicSettings, setAppPublicSettings] = useState({
    public_settings: {
      authentication_required: true,
    },
  });

  useEffect(() => {
    checkUserAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user || null);
      setIsAuthenticated(!!currentSession?.user);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      const { data, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      setSession(data.session);
      setUser(data.session?.user || null);
      setIsAuthenticated(!!data.session?.user);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      setAuthError({
        type: 'auth_error',
        message: error.message || 'Authentication failed',
      });
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const signUp = async (email, password, extraData = {}) => {
    setAuthError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: extraData,
      },
    });

    if (error) {
      setAuthError({
        type: 'signup_error',
        message: error.message,
      });
      throw error;
    }

    return data;
  };

  const login = async (email, password) => {
    setAuthError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError({
        type: 'login_error',
        message: error.message,
      });
      throw error;
    }

    setSession(data.session);
    setUser(data.user);
    setIsAuthenticated(true);

    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();

    setUser(null);
    setSession(null);
    setIsAuthenticated(false);
  };

  const navigateToLogin = (returnUrl) => {
    const params = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '';
    window.location.href = `/login${params}`;
  };

  const checkAppState = async () => {
    await checkUserAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        login,
        signUp,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};