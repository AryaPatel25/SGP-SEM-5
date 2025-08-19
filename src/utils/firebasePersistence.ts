import AsyncStorage from '@react-native-async-storage/async-storage';
import { User as FirebaseUser } from 'firebase/auth';

// Custom persistence implementation to handle Firebase Auth persistence
export class CustomFirebasePersistence {
  private static instance: CustomFirebasePersistence;
  private storage: typeof AsyncStorage;

  private constructor() {
    this.storage = AsyncStorage;
  }

  public static getInstance(): CustomFirebasePersistence {
    if (!CustomFirebasePersistence.instance) {
      CustomFirebasePersistence.instance = new CustomFirebasePersistence();
    }
    return CustomFirebasePersistence.instance;
  }

  // Save user data to AsyncStorage
  async saveUser(user: FirebaseUser): Promise<void> {
    try {
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        lastLoginAt: new Date().toISOString(),
      };
      await this.storage.setItem('firebase_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user to AsyncStorage:', error);
    }
  }

  // Load user data from AsyncStorage
  async loadUser(): Promise<any | null> {
    try {
      const userData = await this.storage.getItem('firebase_user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error loading user from AsyncStorage:', error);
      return null;
    }
  }

  // Clear user data from AsyncStorage
  async clearUser(): Promise<void> {
    try {
      await this.storage.removeItem('firebase_user');
    } catch (error) {
      console.error('Error clearing user from AsyncStorage:', error);
    }
  }

  // Check if user is persisted
  async isUserPersisted(): Promise<boolean> {
    try {
      const userData = await this.storage.getItem('firebase_user');
      return userData !== null;
    } catch (error) {
      console.error('Error checking user persistence:', error);
      return false;
    }
  }
}

// Export singleton instance
export const firebasePersistence = CustomFirebasePersistence.getInstance(); 