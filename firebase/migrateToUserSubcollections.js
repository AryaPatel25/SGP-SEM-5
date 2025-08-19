import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig.js';

/**
 * Migration script to restructure Firebase collections
 * Moves user-related data under the main user collection as subcollections
 */

const migrateUserData = async () => {
  try {
    console.log('Starting migration to user subcollections...');

    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`Found ${users.length} users to migrate`);

    for (const user of users) {
      console.log(`Migrating data for user: ${user.fullName} (${user.id})`);

      // 1. Migrate user_achievements
      await migrateUserAchievements(user.id);

      // 2. Migrate user_activity
      await migrateUserActivity(user.id);

      // 3. Migrate user_progress
      await migrateUserProgress(user.id);

      console.log(`Completed migration for user: ${user.fullName}`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

const migrateUserAchievements = async (userId) => {
  try {
    // Get user achievements from the old collection
    const achievementsSnapshot = await getDocs(collection(db, 'user_achievements'));
    const userAchievements = achievementsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(achievement => achievement.userId === userId);

    if (userAchievements.length > 0) {
      // Create subcollection under user
      const userRef = doc(db, 'users', userId);
      const achievementsSubcollection = collection(userRef, 'achievements');

      // Move each achievement to the subcollection
      for (const achievement of userAchievements) {
        await setDoc(doc(achievementsSubcollection, achievement.id), {
          ...achievement,
          userId: userId,
          migratedAt: new Date().toISOString()
        });

        // Delete from old collection
        await deleteDoc(doc(db, 'user_achievements', achievement.id));
      }

      console.log(`Migrated ${userAchievements.length} achievements for user ${userId}`);
    }
  } catch (error) {
    console.error(`Error migrating achievements for user ${userId}:`, error);
  }
};

const migrateUserActivity = async (userId) => {
  try {
    // Get user activity from the old collection
    const activitySnapshot = await getDocs(collection(db, 'user_activity'));
    const userActivities = activitySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(activity => activity.userId === userId);

    if (userActivities.length > 0) {
      // Create subcollection under user
      const userRef = doc(db, 'users', userId);
      const activitySubcollection = collection(userRef, 'activity');

      // Move each activity to the subcollection
      for (const activity of userActivities) {
        await setDoc(doc(activitySubcollection, activity.id), {
          ...activity,
          userId: userId,
          migratedAt: new Date().toISOString()
        });

        // Delete from old collection
        await deleteDoc(doc(db, 'user_activity', activity.id));
      }

      console.log(`Migrated ${userActivities.length} activities for user ${userId}`);
    }
  } catch (error) {
    console.error(`Error migrating activity for user ${userId}:`, error);
  }
};

const migrateUserProgress = async (userId) => {
  try {
    // Get user progress from the old collection
    const progressSnapshot = await getDocs(collection(db, 'user_progress'));
    const userProgress = progressSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(progress => progress.userId === userId);

    if (userProgress.length > 0) {
      // Create subcollection under user
      const userRef = doc(db, 'users', userId);
      const progressSubcollection = collection(userRef, 'progress');

      // Move each progress record to the subcollection
      for (const progress of userProgress) {
        await setDoc(doc(progressSubcollection, progress.id), {
          ...progress,
          userId: userId,
          migratedAt: new Date().toISOString()
        });

        // Delete from old collection
        await deleteDoc(doc(db, 'user_progress', progress.id));
      }

      console.log(`Migrated ${userProgress.length} progress records for user ${userId}`);
    }
  } catch (error) {
    console.error(`Error migrating progress for user ${userId}:`, error);
  }
};

// Function to create sample data for testing
const createSampleData = async () => {
  try {
    console.log('Creating sample data for testing...');

    // Create sample user achievements
    const sampleAchievements = [
      {
        id: 'achievement-1',
        userId: '19TQYfB3YEPEGSw7fi1ytAU25qJ3',
        type: 'first_interview',
        title: 'First Interview',
        description: 'Completed your first interview',
        earnedAt: new Date().toISOString(),
        icon: '🎯'
      },
      {
        id: 'achievement-2',
        userId: '19TQYfB3YEPEGSw7fi1ytAU25qJ3',
        type: 'perfect_score',
        title: 'Perfect Score',
        description: 'Achieved 100% on an interview',
        earnedAt: new Date().toISOString(),
        icon: '🏆'
      }
    ];

    // Create sample user activity
    const sampleActivity = [
      {
        id: 'activity-1',
        userId: '19TQYfB3YEPEGSw7fi1ytAU25qJ3',
        type: 'interview_completed',
        title: 'Completed JavaScript Interview',
        description: 'Scored 85% on JavaScript domain',
        timestamp: new Date().toISOString(),
        score: 85,
        domain: 'JavaScript'
      },
      {
        id: 'activity-2',
        userId: '19TQYfB3YEPEGSw7fi1ytAU25qJ3',
        type: 'login',
        title: 'Logged in',
        description: 'User logged into the application',
        timestamp: new Date().toISOString()
      }
    ];

    // Create sample user progress
    const sampleProgress = [
      {
        id: 'progress-1',
        userId: '19TQYfB3YEPEGSw7fi1ytAU25qJ3',
        domain: 'JavaScript',
        totalQuestions: 15,
        answeredQuestions: 12,
        correctAnswers: 10,
        averageScore: 83.3,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'progress-2',
        userId: '19TQYfB3YEPEGSw7fi1ytAU25qJ3',
        domain: 'React',
        totalQuestions: 10,
        answeredQuestions: 8,
        correctAnswers: 7,
        averageScore: 87.5,
        lastUpdated: new Date().toISOString()
      }
    ];

    // Add sample data to subcollections
    const userRef = doc(db, 'users', '19TQYfB3YEPEGSw7fi1ytAU25qJ3');

    // Add achievements
    const achievementsRef = collection(userRef, 'achievements');
    for (const achievement of sampleAchievements) {
      await setDoc(doc(achievementsRef, achievement.id), achievement);
    }

    // Add activity
    const activityRef = collection(userRef, 'activity');
    for (const activity of sampleActivity) {
      await setDoc(doc(activityRef, activity.id), activity);
    }

    // Add progress
    const progressRef = collection(userRef, 'progress');
    for (const progress of sampleProgress) {
      await setDoc(doc(progressRef, progress.id), progress);
    }

    console.log('Sample data created successfully!');
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
};

// Export functions
export { createSampleData, migrateUserData };

// Run migration if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  // Check if we want to create sample data or migrate
  const args = process.argv.slice(2);
  
  if (args.includes('--sample')) {
    createSampleData();
  } else {
    migrateUserData();
  }
}
