import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, facebookProvider, githubProvider } from './firebase';
import { handleFirestoreError, OperationType } from './firestore-utils';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  watchlist: string[];
  loading: boolean;
  signInWithGoogle: () => Promise<boolean>;
  signInWithFacebook: () => Promise<boolean>;
  signInWithGithub: () => Promise<boolean>;
  logout: () => Promise<void>;
  toggleWatchlist: (mediaId: string) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const path = `users/${user.uid}`;
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile(data);
            setWatchlist(data.watchlist || []);
          } else {
            const newProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              subscriptionTier: 'free',
              watchlist: [],
              createdAt: serverTimestamp(),
            };
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
            setWatchlist([]);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, path);
        }
      } else {
        setProfile(null);
        setWatchlist([]);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const toggleWatchlist = async (mediaId: string) => {
    if (!user) return;
    const newWatchlist = watchlist.includes(mediaId) 
      ? watchlist.filter(id => id !== mediaId)
      : [...watchlist, mediaId];
    
    setWatchlist(newWatchlist);
    await updateDoc(doc(db, 'users', user.uid), { watchlist: newWatchlist });
  };

  const updateProfile = async (data: any) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), data);
    setProfile(prev => ({ ...prev, ...data }));
  };

  const handleAuth = async (provider: any) => {
    try {
      await signInWithPopup(auth, provider);
      return true;
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        alert('This login provider is not enabled. Please enable it in the Firebase Console under Authentication -> Sign-in method.');
      } else if (error.code !== 'auth/popup-closed-by-user') {
        console.error(error);
        alert('Authentication failed: ' + error.message);
      }
      return false;
    }
  };

  const signInWithGoogle = () => handleAuth(googleProvider);
  const signInWithFacebook = () => handleAuth(facebookProvider);
  const signInWithGithub = () => handleAuth(githubProvider);
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, profile, watchlist, loading, signInWithGoogle, signInWithFacebook, signInWithGithub, logout, toggleWatchlist, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
