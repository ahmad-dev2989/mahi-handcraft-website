import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
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

    // Check for redirect result if returning from Firebase Google Redirect
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          await syncAndSetGoogleUser({
            uid: result.user.uid,
            name: result.user.displayName || 'Google User',
            email: result.user.email || '',
            photoURL: result.user.photoURL || undefined
          });
        }
      })
      .catch((err) => {
        console.warn('Firebase getRedirectResult notice:', err);
      });

    // Also check for return from Google Auth popup or page redirect
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('google_auth_success') === '1') {
        const rawName = urlParams.get('name') || 'Google User';
        const rawEmail = urlParams.get('email') || '';
        const rawUid = urlParams.get('uid') || `google_${Date.now()}`;
        const cleanName = decodeURIComponent(rawName);
        const cleanEmail = decodeURIComponent(rawEmail);
        const cleanUid = decodeURIComponent(rawUid);

        const cleanPath = window.location.pathname;
        window.history.replaceState({}, document.title, cleanPath);

        syncAndSetGoogleUser({
          uid: cleanUid,
          name: cleanName,
          email: cleanEmail
        });
      }
    } catch (e) {
      console.warn('Error reading URL auth params:', e);
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

  // Helper to persist Google user to Firestore & state
  const syncAndSetGoogleUser = async (userData: {
    uid: string;
    name: string;
    email: string;
    photoURL?: string;
  }) => {
    let userProfile: UserProfile;
    try {
      const userDocRef = doc(db, 'users', userData.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        userProfile = userDocSnap.data() as UserProfile;
      } else {
        userProfile = {
          uid: userData.uid,
          name: userData.name || 'Google User',
          email: userData.email || '',
          role: 'CUSTOMER',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, userProfile);
      }
    } catch (dbErr) {
      console.warn('Could not sync Google user to Firestore:', dbErr);
      userProfile = {
        uid: userData.uid,
        name: userData.name || 'Google User',
        email: userData.email || '',
        role: 'CUSTOMER',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    setUser({
      uid: userData.uid,
      email: userData.email,
      displayName: userData.name,
      photoURL: userData.photoURL
    } as any);
    setProfile(userProfile);
    localStorage.setItem('mahi_mock_session', JSON.stringify(userProfile));
    return userProfile;
  };

  // Helper to open dedicated Google Sign-in popup window
  const openGoogleAuthWindow = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const width = 500;
      const height = 660;
      const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
      const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2.5);

      const authWindow = window.open(
        '/google-auth.html',
        'GoogleSignIn',
        `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no,scrollbars=yes`
      );

      if (!authWindow) {
        // If popup is blocked, redirect the window
        window.location.href = `/google-auth.html?redirect=${encodeURIComponent(window.location.href)}`;
        return;
      }

      let pollTimer: any = null;

      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data?.user) {
          window.removeEventListener('message', handleMessage);
          if (pollTimer) clearInterval(pollTimer);
          try {
            await syncAndSetGoogleUser(event.data.user);
            resolve();
          } catch (err) {
            reject(err);
          }
        }
      };

      window.addEventListener('message', handleMessage);

      pollTimer = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(pollTimer);
          window.removeEventListener('message', handleMessage);
          resolve();
        }
      }, 500);
    });
  };

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

    if (isMockMode) {
      try {
        await openGoogleAuthWindow();
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      try {
        const result = await signInWithPopup(auth, provider);
        if (result && result.user) {
          await syncAndSetGoogleUser({
            uid: result.user.uid,
            name: result.user.displayName || 'Google User',
            email: result.user.email || '',
            photoURL: result.user.photoURL || undefined
          });
          return;
        }
      } catch (popupErr: any) {
        console.warn('Firebase signInWithPopup notice:', popupErr.code, popupErr.message);

        if (popupErr.code === 'auth/popup-closed-by-user') {
          return;
        }

        if (popupErr.code === 'auth/popup-blocked') {
          console.info('Popup blocked by browser, attempting redirect flow...');
          try {
            await signInWithRedirect(auth, provider);
            return;
          } catch (redirectErr) {
            console.warn('signInWithRedirect also blocked, opening fallback window:', redirectErr);
          }
        }

        // When Google Provider is not yet enabled in Firebase Console (CONFIGURATION_NOT_FOUND)
        // or unauthorized domain, provide the dedicated Google sign-in window
        if (
          popupErr.code === 'auth/configuration-not-found' ||
          popupErr.code === 'auth/operation-not-allowed' ||
          popupErr.code === 'auth/unauthorized-domain' ||
          popupErr.code === 'auth/internal-error' ||
          popupErr.message?.includes('CONFIGURATION_NOT_FOUND')
        ) {
          await openGoogleAuthWindow();
          return;
        }

        throw popupErr;
      }
    } catch (error: any) {
      console.warn('Falling back to Google authentication window due to:', error);
      try {
        await openGoogleAuthWindow();
      } catch (finalErr: any) {
        throw new Error(error.message || 'Failed to sign in with Google.');
      }
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
