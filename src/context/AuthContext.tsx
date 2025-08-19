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
import { firebasePersistence } from '../utils/firebasePersistence';
import { simpleGoogleSignIn } from '../utils/simpleGoogleSignIn';

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

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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
    fullName: firebaseUser.displayName || 'User',
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
        fullName: data.fullName || 'User',
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
      if (firebaseUser) {
        // Save user to custom persistence
        await firebasePersistence.saveUser(firebaseUser);
        
        // Fetch user from Firestore for fullName, etc.
        const userFromDb = await fetchUserFromFirestore(firebaseUser.uid);
        if (userFromDb) {
          setUser(userFromDb);
          // Update last login time
          await updateUserInFirestore(firebaseUser.uid, { lastLoginAt: new Date() });
        } else {
          const userData = convertFirebaseUser(firebaseUser);
          setUser(userData);
          // Save new user to Firestore
          await saveUserToFirestore(userData);
        }
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        // Clear user from custom persistence
        await firebasePersistence.clearUser();
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
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
      
      // Save user to custom persistence
      await firebasePersistence.saveUser(firebaseUser);
      
      // Fetch user from Firestore for fullName, etc.
      const userFromDb = await fetchUserFromFirestore(firebaseUser.uid);
      let userData: User;
      if (userFromDb) {
        userData = userFromDb;
        // Update last login time
        await updateUserInFirestore(firebaseUser.uid, { lastLoginAt: new Date() });
      } else {
        userData = convertFirebaseUser(firebaseUser);
        // Save new user to Firestore
        await saveUserToFirestore(userData);
      }
      setUser(userData);
      setIsAuthenticated(true);
      
      if (credentials.rememberMe) {
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error: any) {
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
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        credentials.email, 
        credentials.password
      );
      const firebaseUser = userCredential.user;
      const userData = convertFirebaseUser(firebaseUser);
      userData.fullName = credentials.fullName;
      
      // Save user to custom persistence
      await firebasePersistence.saveUser(firebaseUser);
      
      // Store user details in Firestore
      await saveUserToFirestore(userData);
      
      setUser(userData);
      setIsAuthenticated(true);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error: any) {
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
      console.log('AuthContext: signInWithGoogle started');
      setIsLoading(true);
      
      console.log('AuthContext: Calling simpleGoogleSignIn...');
      const result = await simpleGoogleSignIn();
      console.log('AuthContext: simpleGoogleSignIn result:', result);
      
      if (result.success && result.user) {
        console.log('AuthContext: Google Sign-In successful, processing user...');
        const firebaseUser = result.user;
        
        // Save user to custom persistence
        await firebasePersistence.saveUser(firebaseUser);
        
        const userFromDb = await fetchUserFromFirestore(firebaseUser.uid);
        let userData: User;
        
        if (userFromDb) {
          userData = userFromDb;
          // Update last login time
          await updateUserInFirestore(firebaseUser.uid, { lastLoginAt: new Date() });
        } else {
          userData = convertFirebaseUser(firebaseUser);
          // Store user in Firestore if they don't exist
          await saveUserToFirestore(userData);
        }
        
        setUser(userData);
        setIsAuthenticated(true);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        console.log('AuthContext: User successfully signed in and data saved');
      } else {
        // For mobile redirect, the user will be handled by the redirect result
        console.log('AuthContext: Google Sign-In redirect initiated or failed:', result.error);
        if (result.error && !result.error.includes('Redirecting')) {
          throw new Error(result.error);
        }
      }
      
    } catch (error: any) {
      console.error('AuthContext: Google Sign-In Error:', error);
      let errorMessage = 'Google Sign-In failed. Please try again.';
      if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account with this email already exists. Please sign in with that account or reset your password.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid Google credentials.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google Sign-In is not enabled for this project.';
      } else if (error.code === 'auth/credential-already-in-use') {
        errorMessage = 'This credential is already in use with a different account.';
      }
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      setUser(null);
      setIsAuthenticated(false);
      await AsyncStorage.removeItem('user');
      // Clear user from custom persistence
      await firebasePersistence.clearUser();
    } catch (error) {
      console.error('Error during logout:', error);
      throw new Error('Logout failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<string> => {
    try {
      console.log('Firebase: Starting password reset for:', email);
      setIsLoading(true);
      await sendPasswordResetEmail(auth, email);
      console.log('Firebase: Password reset email sent successfully');
      return 'Password reset email sent. Please check your inbox.';
    } catch (error: any) {
      console.error('Firebase: Password reset error:', error);
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
      console.error('Error updating user profile:', error);
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 