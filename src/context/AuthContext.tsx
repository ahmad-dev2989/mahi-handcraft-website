import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isMockMode } from '../lib/firebase';
import type { UserProfile } from '../types';

export interface AdminCredentials {
  username: string;
  email: string;
  name: string;
  password: string;
}

export const getStoredAdminCredentials = (): AdminCredentials => {
  try {
    const saved = localStorage.getItem('mahi_admin_credentials');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error reading admin credentials:', e);
  }
  return {
    username: 'admin',
    email: 'mahihandwoven059@gmail.com',
    name: 'Administrator',
    password: 'admin123'
  };
};

export const fetchFirestoreAdminCredentials = async (): Promise<AdminCredentials> => {
  if (!isMockMode) {
    try {
      const snap = await getDoc(doc(db, 'system', 'admin_credentials'));
      if (snap.exists()) {
        const data = snap.data() as AdminCredentials;
        localStorage.setItem('mahi_admin_credentials', JSON.stringify(data));
        return data;
      }
      // If not yet seeded in Firestore, initialize it
      const initial: AdminCredentials = {
        username: 'admin',
        email: 'mahihandwoven059@gmail.com',
        name: 'Administrator',
        password: 'admin123'
      };
      await setDoc(doc(db, 'system', 'admin_credentials'), initial);
      localStorage.setItem('mahi_admin_credentials', JSON.stringify(initial));
      return initial;
    } catch (e) {
      console.warn('Could not read admin credentials from Firestore:', e);
    }
  }
  return getStoredAdminCredentials();
};

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  updateAdminCredentials: (data: { username: string; email: string; name: string; password?: string }) => Promise<void>;
  updateUserCredentials: (userId: string, data: { name: string; email?: string; password?: string }) => Promise<void>;
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
    const loadSavedSession = () => {
      const savedSession = localStorage.getItem('mahi_mock_session');
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession) as UserProfile;
          setUser({ uid: parsed.uid, email: parsed.email, displayName: parsed.name } as any);
          setProfile(parsed);
          return true;
        } catch (e) {
          console.error('Error parsing saved session:', e);
        }
      }
      return false;
    };

    if (isMockMode) {
      loadSavedSession();
      setLoading(false);
      return;
    }

    // Live Firebase Auth initialization
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const hasSession = loadSavedSession();

      if (firebaseUser) {
        setUser(firebaseUser);
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
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, defaultProfile);
            setProfile(defaultProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          if (!hasSession) setProfile(null);
        }
      } else if (!hasSession) {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // ==========================================
  // AUTH METHODS
  // ==========================================
  const signupLocal = (email: string, name: string, password?: string) => {
    const mockUsersRaw = localStorage.getItem('mahi_mock_users') || '[]';
    const mockUsers = JSON.parse(mockUsersRaw) as (UserProfile & { password?: string })[];
    
    if (mockUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Registration failed: Email is already registered.');
    }

    const uid = `mock_user_${Date.now()}`;
    const newProfile: UserProfile = {
      uid,
      name,
      email,
      role: 'CUSTOMER',
      password: password || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockUsers.push(newProfile);
    localStorage.setItem('mahi_mock_users', JSON.stringify(mockUsers));
    
    setUser({ uid, email, displayName: name } as any);
    setProfile(newProfile);
    localStorage.setItem('mahi_mock_session', JSON.stringify(newProfile));
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    
    // Check Permanent Admin Credentials from Cloud Firestore
    const adminCreds = await fetchFirestoreAdminCredentials();
    const configuredUsername = (adminCreds.username || '').trim().toLowerCase();
    const configuredEmail = (adminCreds.email || '').trim().toLowerCase();

    const isAdminMatch = 
      (configuredUsername !== '' && cleanEmail === configuredUsername) ||
      (configuredEmail !== '' && cleanEmail === configuredEmail);

    if (isAdminMatch) {
      const validPassword = adminCreds.password;
      if (password === validPassword) {
        const adminUser: UserProfile = {
          uid: 'admin_hardcoded_001',
          name: adminCreds.name || 'Administrator',
          email: adminCreds.email || cleanEmail,
          role: 'ADMIN',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setUser({ uid: adminUser.uid, email: adminUser.email, displayName: adminUser.name } as any);
        setProfile(adminUser);
        localStorage.setItem('mahi_mock_session', JSON.stringify(adminUser));
        setLoading(false);
        return;
      } else {
        setLoading(false);
        throw new Error('Incorrect password for admin account.');
      }
    }

    if (isMockMode) {
      const mockUsersRaw = localStorage.getItem('mahi_mock_users') || '[]';
      const mockUsers = JSON.parse(mockUsersRaw) as (UserProfile & { password?: string })[];
      const foundUser = mockUsers.find(u => u.email.toLowerCase() === cleanEmail);
      
      if (!foundUser) {
        setLoading(false);
        throw new Error('Authentication failed: Email address not found. Please register first.');
      }

      if (foundUser.password && foundUser.password !== password) {
        setLoading(false);
        throw new Error('Incorrect password. Please try again.');
      }
      
      setUser({ uid: foundUser.uid, email: foundUser.email, displayName: foundUser.name } as any);
      setProfile(foundUser);
      localStorage.setItem('mahi_mock_session', JSON.stringify(foundUser));
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      // Fallback to local storage if user was registered locally or Firebase Auth is unconfigured
      const mockUsersRaw = localStorage.getItem('mahi_mock_users') || '[]';
      const mockUsers = JSON.parse(mockUsersRaw) as (UserProfile & { password?: string })[];
      const foundUser = mockUsers.find(u => u.email.toLowerCase() === cleanEmail);
      
      if (foundUser) {
        if (foundUser.password && foundUser.password !== password) {
          setLoading(false);
          throw new Error('Incorrect password. Please try again.');
        }
        setUser({ uid: foundUser.uid, email: foundUser.email, displayName: foundUser.name } as any);
        setProfile(foundUser);
        localStorage.setItem('mahi_mock_session', JSON.stringify(foundUser));
        setLoading(false);
        return;
      }

      setLoading(false);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    if (isMockMode) {
      setLoading(true);
      try {
        signupLocal(email, name, password);
      } finally {
        setLoading(false);
      }
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
    } catch (error: any) {
      console.warn('Firebase auth failed during signup, using local account store:', error);
      try {
        signupLocal(email, name, password);
      } catch (localErr) {
        setLoading(false);
        throw localErr;
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      // Forces Google Account Chooser so the browser displays real Google accounts
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Sync user profile to Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      let userProfile: UserProfile;
      if (userDocSnap.exists()) {
        userProfile = userDocSnap.data() as UserProfile;
      } else {
        userProfile = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'Google Customer',
          email: firebaseUser.email || '',
          role: 'CUSTOMER',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, userProfile);
      }

      setUser(firebaseUser);
      setProfile(userProfile);
      localStorage.setItem('mahi_mock_session', JSON.stringify(userProfile));
      return;
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);

      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return;
      }
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Google Sign-In popup was blocked by your browser. Please allow popups for this site.');
      }
      if (error.code === 'auth/unauthorized-domain') {
        throw new Error(`Domain (${window.location.hostname}) is not authorized in Firebase Console. Please add it to Firebase Console > Authentication > Settings > Authorized Domains.`);
      }
      if (
        error.code === 'auth/configuration-not-found' ||
        error.code === 'auth/operation-not-allowed' ||
        error.message?.includes('CONFIGURATION_NOT_FOUND')
      ) {
        throw new Error('Google Sign-In provider is initializing in Firebase. Please refresh the page and try again.');
      }

      throw new Error(error.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    localStorage.removeItem('mahi_mock_session');
    setUser(null);
    setProfile(null);

    if (!isMockMode && auth.currentUser) {
      try {
        await signOut(auth);
      } catch (e) {
        console.error('Error during signOut:', e);
      }
    }
    setLoading(false);
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

  const updateAdminCredentials = async (data: { username: string; email: string; name: string; password?: string }) => {
    const current = await fetchFirestoreAdminCredentials();
    const updated: AdminCredentials = {
      username: data.username.trim() || current.username,
      email: data.email.trim() || current.email,
      name: data.name.trim() || current.name,
      password: data.password && data.password.trim() ? data.password.trim() : current.password
    };
    localStorage.setItem('mahi_admin_credentials', JSON.stringify(updated));

    // Persist directly to Firestore Cloud Database so all devices sync
    if (!isMockMode) {
      try {
        await setDoc(doc(db, 'system', 'admin_credentials'), updated, { merge: true });
      } catch (err) {
        console.error('Firestore admin credentials sync failed:', err);
        throw err;
      }
    }

    // Update active admin session if currently signed in
    if (profile?.role === 'ADMIN') {
      const updatedProfile: UserProfile = {
        ...profile,
        name: updated.name,
        email: updated.email,
        updatedAt: new Date().toISOString()
      };
      setProfile(updatedProfile);
      setUser({ uid: profile.uid, email: updated.email, displayName: updated.name } as any);
      localStorage.setItem('mahi_mock_session', JSON.stringify(updatedProfile));
    }
  };

  const updateUserCredentials = async (userId: string, data: { name: string; email?: string; password?: string }) => {
    const mockUsersRaw = localStorage.getItem('mahi_mock_users') || '[]';
    const mockUsers = JSON.parse(mockUsersRaw) as (UserProfile & { password?: string })[];
    
    const index = mockUsers.findIndex(u => u.uid === userId);
    if (index !== -1) {
      mockUsers[index] = {
        ...mockUsers[index],
        name: data.name.trim() || mockUsers[index].name,
        email: data.email ? data.email.trim() : mockUsers[index].email,
        password: data.password && data.password.trim() ? data.password.trim() : mockUsers[index].password,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('mahi_mock_users', JSON.stringify(mockUsers));
      
      // If updating currently logged in user session
      if (profile?.uid === userId) {
        setProfile(mockUsers[index]);
        localStorage.setItem('mahi_mock_session', JSON.stringify(mockUsers[index]));
      }
    }

    if (!isMockMode) {
      try {
        const updatePayload: any = {
          name: data.name.trim(),
          updatedAt: new Date()
        };
        if (data.email) updatePayload.email = data.email.trim();
        if (data.password) updatePayload.password = data.password.trim();
        await setDoc(doc(db, 'users', userId), updatePayload, { merge: true });
      } catch (err) {
        console.warn('Firestore updateUserCredentials note:', err);
      }
    }
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'ADMIN',
    login,
    signup,
    loginWithGoogle,
    logout,
    resetPassword,
    updateProfileData,
    updateAdminCredentials,
    updateUserCredentials
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
