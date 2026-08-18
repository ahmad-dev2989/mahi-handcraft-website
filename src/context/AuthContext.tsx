import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isMockMode } from '../lib/firebase';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // INITIALIZATION
  // ==========================================
  useEffect(() => {
    if (isMockMode) {
      // Mock mode initialization: Load dummy session from localStorage
      const savedSession = localStorage.getItem('mahi_mock_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession) as UserProfile;
        setUser({ uid: parsed.uid, email: parsed.email, displayName: parsed.name } as any);
        setProfile(parsed);
      }
      setLoading(false);
      return;
    }

    // Live Firebase Auth initialization
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          let userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            setProfile(userDocSnap.data() as UserProfile);
          } else {
            const defaultProfile: UserProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Customer',
              email: firebaseUser.email || '',
              role: 'CUSTOMER',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            await setDoc(userDocRef, defaultProfile);
            setProfile(defaultProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // ==========================================
  // AUTH METHODS
  // ==========================================
  const login = async (email: string, password: string) => {
    if (isMockMode) {
      setLoading(true);
      // Fetch mock users list from localStorage
      const mockUsersRaw = localStorage.getItem('mahi_mock_users') || '[]';
      const mockUsers = JSON.parse(mockUsersRaw) as UserProfile[];
      const foundUser = mockUsers.find(u => u.email === email);
      
      if (!foundUser) {
        setLoading(false);
        throw new Error('Authentication failed: Email address not found. Please register first.');
      }
      
      setUser({ uid: foundUser.uid, email: foundUser.email, displayName: foundUser.name } as any);
      setProfile(foundUser);
      localStorage.setItem('mahi_mock_session', JSON.stringify(foundUser));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    if (isMockMode) {
      setLoading(true);
      const mockUsersRaw = localStorage.getItem('mahi_mock_users') || '[]';
      const mockUsers = JSON.parse(mockUsersRaw) as UserProfile[];
      
      // Check if email already registered
      if (mockUsers.some(u => u.email === email)) {
        setLoading(false);
        throw new Error('Registration failed: Email is already registered.');
      }

      // In mock mode, if database has no customers, make the first signup an ADMIN for testing!
      const role = mockUsers.length === 0 ? 'ADMIN' : 'CUSTOMER';
      const uid = `mock_user_${Date.now()}`;
      
      const newProfile: UserProfile = {
        uid,
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save user to lists
      mockUsers.push(newProfile);
      localStorage.setItem('mahi_mock_users', JSON.stringify(mockUsers));
      
      // Create session
      setUser({ uid, email, displayName: name } as any);
      setProfile(newProfile);
      localStorage.setItem('mahi_mock_session', JSON.stringify(newProfile));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const newProfile: UserProfile = {
        uid: credential.user.uid,
        name,
        email,
        role: 'CUSTOMER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await setDoc(doc(db, 'users', credential.user.uid), newProfile);
      setProfile(newProfile);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    if (isMockMode) {
      setLoading(true);
      setUser(null);
      setProfile(null);
      localStorage.removeItem('mahi_mock_session');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    if (isMockMode) {
      console.log(`[MOCK AUTH] Password reset link requested for: ${email}`);
      return;
    }
    await sendPasswordResetEmail(auth, email);
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (isMockMode) {
      if (!profile) throw new Error('Not authenticated');
      const updated = {
        ...profile,
        ...data,
        updatedAt: new Date().toISOString()
      } as UserProfile;

      // Update current session
      setProfile(updated);
      localStorage.setItem('mahi_mock_session', JSON.stringify(updated));

      // Update in users registry list
      const mockUsersRaw = localStorage.getItem('mahi_mock_users') || '[]';
      const mockUsers = JSON.parse(mockUsersRaw) as UserProfile[];
      const updatedList = mockUsers.map(u => u.uid === profile.uid ? updated : u);
      localStorage.setItem('mahi_mock_users', JSON.stringify(updatedList));
      return;
    }

    if (!user) throw new Error('Not authenticated');
    const userDocRef = doc(db, 'users', user.uid);
    const updatedProfile = {
      ...profile,
      ...data,
      updatedAt: new Date(),
    } as UserProfile;
    
    await setDoc(userDocRef, updatedProfile, { merge: true });
    setProfile(updatedProfile);
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'ADMIN',
    login,
    signup,
    logout,
    resetPassword,
    updateProfileData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
