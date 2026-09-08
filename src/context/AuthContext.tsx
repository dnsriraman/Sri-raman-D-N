import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError } from '../firebase';
import { UserProfile, OperationType } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  studioModalOpen: boolean;
  setStudioModalOpen: (open: boolean) => void;
  activeStudioTab: 'projects' | 'credentials' | 'messages' | 'database' | 'bulk_import' | 'logins';
  setActiveStudioTab: (tab: 'projects' | 'credentials' | 'messages' | 'database' | 'bulk_import' | 'logins') => void;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  lastLoginAlertInfo: { sent: boolean; recipient: string; timestamp: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ['dnsriraman@gmail.com'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [studioModalOpen, setStudioModalOpen] = useState(false);
  const [activeStudioTab, setActiveStudioTab] = useState<'projects' | 'credentials' | 'messages' | 'database' | 'bulk_import' | 'logins'>('projects');
  const [lastLoginAlertInfo, setLastLoginAlertInfo] = useState<{ sent: boolean; recipient: string; timestamp: string } | null>(null);

  const isAdmin = Boolean(
    user &&
    user.email &&
    (ADMIN_EMAILS.map((e) => e.toLowerCase()).includes((user.email || '').toLowerCase()) ||
     (user.email || '').toLowerCase().includes('dnsriraman') ||
     userProfile?.role === 'admin')
  );

  const notifyLoginEvent = async (firebaseUser: User, profile?: UserProfile | null) => {
    const sessionKey = `login_notified_${firebaseUser.uid}_${new Date().toDateString()}`;
    if (sessionStorage.getItem(sessionKey)) {
      return; // Already notified in current session
    }

    try {
      const loginId = `login_${Date.now()}_${firebaseUser.uid.slice(0, 5)}`;
      const timestamp = new Date().toISOString();
      const userRole = profile?.role || (ADMIN_EMAILS.includes(firebaseUser.email || '') ? 'admin' : 'editor');

      // 1. Post to Backend Instant Mailer API
      const res = await fetch('/api/auth/notify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || profile?.displayName || 'User',
            photoURL: firebaseUser.photoURL || '',
            role: userRole,
          },
          metadata: {
            userAgent: navigator.userAgent,
            device: /mobile/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
            timestamp,
          },
        }),
      });

      if (res.ok) {
        setLastLoginAlertInfo({
          sent: true,
          recipient: 'dnsriraman@gmail.com',
          timestamp,
        });
        sessionStorage.setItem(sessionKey, 'true');
      }

      // 2. Also log to Firestore /logins collection
      try {
        const loginDocRef = doc(db, 'logins', loginId);
        await setDoc(loginDocRef, {
          id: loginId,
          userId: firebaseUser.uid,
          displayName: firebaseUser.displayName || profile?.displayName || 'User',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || '',
          role: userRole,
          loginAt: timestamp,
          userAgent: navigator.userAgent,
          device: /mobile/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
          mailSent: true,
          mailSentTo: 'dnsriraman@gmail.com',
        });
      } catch (fErr) {
        console.warn('Could not write login record to Firestore:', fErr);
      }
    } catch (err) {
      console.warn('Instant login mail notification error:', err);
    }
  };

  const fetchOrCreateProfile = async (firebaseUser: User) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    let resolvedProfile: UserProfile | null = null;
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        resolvedProfile = snap.data() as UserProfile;
        setUserProfile(resolvedProfile);
      } else {
        const isUserAdmin = ADMIN_EMAILS.map((e) => e.toLowerCase()).includes((firebaseUser.email || '').toLowerCase()) ||
          (firebaseUser.email || '').toLowerCase().includes('dnsriraman');
        const newProfile: UserProfile = {
          userId: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'Developer',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || '',
          role: isUserAdmin ? 'admin' : 'viewer',
          bio: 'Software engineer & tech enthusiast',
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
        resolvedProfile = newProfile;
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.warn('Could not sync user profile with Firestore:', error);
      // Fallback local representation
      const isUserAdmin = ADMIN_EMAILS.map((e) => e.toLowerCase()).includes((firebaseUser.email || '').toLowerCase()) ||
        (firebaseUser.email || '').toLowerCase().includes('dnsriraman');
      resolvedProfile = {
        userId: firebaseUser.uid,
        displayName: firebaseUser.displayName || 'Developer',
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || '',
        role: isUserAdmin ? 'admin' : 'viewer',
      };
      setUserProfile(resolvedProfile);
    }

    // Trigger instant email notification
    await notifyLoginEvent(firebaseUser, resolvedProfile);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchOrCreateProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await fetchOrCreateProfile(result.user);
        setAuthModalOpen(false);
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      // Provide actionable feedback if popup blocked or cancelled
      if (error?.code === 'auth/popup-closed-by-user') {
        return;
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setStudioModalOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchOrCreateProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isAdmin,
        loading,
        authModalOpen,
        setAuthModalOpen,
        studioModalOpen,
        setStudioModalOpen,
        activeStudioTab,
        setActiveStudioTab,
        signInWithGoogle,
        logout,
        refreshProfile,
        lastLoginAlertInfo,
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
