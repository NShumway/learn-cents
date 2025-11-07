import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, type AuthUser } from '../lib/supabase';
import { getCurrentSession, getAccessToken } from '../lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  hasConsent: boolean | null;
  checkConsent: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);

  const checkConsentStatus = async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/consent', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHasConsent(data.hasConsent);
      } else {
        setHasConsent(false);
      }
    } catch (err) {
      console.error('Failed to check consent status:', err);
      setHasConsent(false);
    }
  };

  useEffect(() => {
    // Check active session and fetch full user data
    getCurrentSession().then(async (session) => {
      if (session) {
        // Fetch full user data including isAdmin
        try {
          const token = await getAccessToken();
          const response = await fetch('/api/auth', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            setUser(session);
          }
        } catch (err) {
          console.error('Failed to fetch user data:', err);
          setUser(session);
        }
        checkConsentStatus();
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Fetch full user data including isAdmin
        try {
          const token = session.access_token;
          const response = await fetch('/api/auth', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            setUser({
              id: session.user.id,
              email: session.user.email!,
            });
          }
        } catch (err) {
          console.error('Failed to fetch user data:', err);
          setUser({
            id: session.user.id,
            email: session.user.email!,
          });
        }
        checkConsentStatus();
      } else {
        setUser(null);
        setHasConsent(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setUser(null);
    setHasConsent(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        hasConsent,
        checkConsent: checkConsentStatus,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
