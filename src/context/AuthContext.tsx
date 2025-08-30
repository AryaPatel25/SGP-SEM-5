import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    createUserWithEmailAndPassword,
    User as FirebaseUser,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../../firebase/firebaseConfig';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  createdAt: Date;
  profilePicture?: string;
  lastLoginAt?: Date;
  isEmailVerified?: boolean;
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    notifications?: boolean;
    language?: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface SignupCredentials {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to convert Firebase user to our User interface
const convertFirebaseUser = (firebaseUser: FirebaseUser): User => {
  return {
    id: firebaseUser.uid,
    fullName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
    email: firebaseUser.email || '',
    phone: firebaseUser.phoneNumber || undefined,
    createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
    profilePicture: firebaseUser.photoURL || undefined,
    isEmailVerified: firebaseUser.emailVerified,
    lastLoginAt: new Date(),
  };
};

const fetchUserFromFirestore = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        id: uid,
        fullName: data.fullName || (data.email ? String(data.email).split('@')[0] : 'User'),
        email: data.email || '',
        phone: data.phone || undefined,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        profilePicture: data.profilePicture || undefined,
        lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : new Date(),
        isEmailVerified: data.isEmailVerified || false,
        preferences: data.preferences || {},
      };
    }
    return null;
  } catch (e) {
    console.error('Error fetching user from Firestore:', e);
    return null;
  }
};

const saveUserToFirestore = async (user: User): Promise<void> => {
  try {
    await setDoc(doc(db, 'users', user.id), {
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || null,
      createdAt: user.createdAt.toISOString(),
      profilePicture: user.profilePicture || null,
      lastLoginAt: user.lastLoginAt?.toISOString() || new Date().toISOString(),
      isEmailVerified: user.isEmailVerified || false,
      preferences: user.preferences || {},
      // Nested, denormalized fields for quick reads
      achievements: [],
      stats: {
        totalInterviews: 0,
        averageScore: 0,
        answeredQuestions: 0,
        totalQuestions: 0,
        updatedAt: new Date().toISOString(),
      },
      progressSummary: {},
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Error saving user to Firestore:', e);
    throw new Error('Failed to save user data');
  }
};

const updateUserInFirestore = async (uid: string, updates: Partial<User>): Promise<void> => {
  try {
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (updates.fullName) updateData.fullName = updates.fullName;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.profilePicture !== undefined) updateData.profilePicture = updates.profilePicture;
    if (updates.preferences) updateData.preferences = updates.preferences;
    if (updates.lastLoginAt) updateData.lastLoginAt = updates.lastLoginAt.toISOString();

    await updateDoc(doc(db, 'users', uid), updateData);
  } catch (e) {
    console.error('Error updating user in Firestore:', e);
    throw new Error('Failed to update user data');
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      
      try {
        if (firebaseUser) {
          // Fetch user from Firestore for fullName, etc.
          const userFromDb = await fetchUserFromFirestore(firebaseUser.uid);
          if (userFromDb) {
            setUser(userFromDb);
            setIsAuthenticated(true);
            // Update last login time
            await updateUserInFirestore(firebaseUser.uid, { lastLoginAt: new Date() });
          } else {
            const userData = convertFirebaseUser(firebaseUser);
            setUser(userData);
            setIsAuthenticated(true);
            // Save new user to Firestore
            await saveUserToFirestore(userData);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth error:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    });

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      // cleanup
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      
      // Validate that input is an email address
      if (!credentials.email.includes('@')) {
        throw new Error('Please enter a valid email address.');
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      const firebaseUser = userCredential.user;
      
      // The auth state listener will handle setting the user state
      // We don't need to manually set it here
      
      if (credentials.rememberMe) {
        await AsyncStorage.setItem('user', JSON.stringify({ id: firebaseUser.uid }));
      }
      // done
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    try {
      // create user
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        credentials.email, 
        credentials.password
      );
      const firebaseUser = userCredential.user;
      const userData = convertFirebaseUser(firebaseUser);
      userData.fullName = credentials.fullName;
      
      // Store user details in Firestore
      await saveUserToFirestore(userData);
      
      // Optimistically set auth state so UI can proceed immediately
      setUser(userData);
      setIsAuthenticated(true);

      // The auth state listener will also reconcile the state
      await AsyncStorage.setItem('user', JSON.stringify({ id: firebaseUser.uid }));
      // done
    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMessage = 'Signup failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      }
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      // google sign-in not implemented yet
      throw new Error('Google Sign-In is not implemented yet. Please use email/password.');
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      throw new Error('Google Sign-In failed. Please try again.');
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      setUser(null);
      setIsAuthenticated(false);
      await AsyncStorage.removeItem('user');
      // done
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Logout failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<string> => {
    try {
      setIsLoading(true);
      await sendPasswordResetEmail(auth, email);
      // done
      return 'Password reset email sent. Please check your inbox.';
    } catch (error: any) {
      console.error('Password reset error:', error);
      let errorMessage = 'Failed to send password reset email.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      setIsLoading(true);
      
      // Update user in Firestore
      await updateUserInFirestore(user.id, updates);
      
      // Update local state
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      // Update AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
    } catch (error) {
      console.error('Profile update error:', error);
      throw new Error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    signInWithGoogle,
    logout,
    forgotPassword,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return a default context instead of throwing an error
    return {
      user: null,
      isLoading: true,
      isAuthenticated: false,
      login: async () => { throw new Error('Auth not initialized'); },
      signup: async () => { throw new Error('Auth not initialized'); },
      signInWithGoogle: async () => { throw new Error('Auth not initialized'); },
      logout: async () => { throw new Error('Auth not initialized'); },
      forgotPassword: async () => { throw new Error('Auth not initialized'); },
      updateUserProfile: async () => { throw new Error('Auth not initialized'); },
    };
  }
  return context;
}; 