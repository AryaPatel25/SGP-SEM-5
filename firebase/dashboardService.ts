import { arrayUnion, collection, doc, getDocs, limit, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface UserProgress {
  userId: string;
  totalInterviews: number;
  averageScore: number;
  questionsAnswered: number;
  timeSpent: number; // in minutes
  lastUpdated: Date;
  domainScores: {
    [domain: string]: {
      totalInterviews: number;
      averageScore: number;
      bestScore: number;
    };
  };
}

export interface InterviewSession {
  id: string;
  userId: string;
  domain: string;
  questionType: 'descriptive' | 'quiz';
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number; // in minutes
  completedAt: Date;
  answers: Array<{
    questionId: string;
    userAnswer: string;
    isCorrect: boolean;
  }>;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  criteria: {
    type: 'interviews_completed' | 'score_threshold' | 'consecutive_days' | 'domain_mastery';
    value: number;
    domain?: string;
  };
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface UserActivity {
  id: string;
  userId: string;
  type: 'interview_completed' | 'achievement_unlocked' | 'streak_milestone';
  title: string;
  description: string;
  metadata?: any;
  timestamp: Date;
}

// Dashboard Service Class
export class DashboardService {
  // Get user progress from subcollection
  static async getUserProgress(userId: string) {
    try {
      const userRef = doc(db, 'users', userId);
      const progressRef = collection(userRef, 'progress');
      const progressSnapshot = await getDocs(progressRef);
      
      const progress = progressSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any)
      }));

      return {
        totalDomains: progress.length,
        totalQuestions: progress.reduce((sum, p) => sum + (p.totalQuestions || 0), 0),
        answeredQuestions: progress.reduce((sum, p) => sum + (p.answeredQuestions || 0), 0),
        averageScore: progress.length > 0 
          ? progress.reduce((sum, p) => sum + (p.averageScore || 0), 0) / progress.length 
          : 0,
        domainProgress: progress
      };
    } catch (error) {
      console.error('Error fetching user progress:', error);
        return {
        totalDomains: 0,
        totalQuestions: 0,
        answeredQuestions: 0,
        averageScore: 0,
        domainProgress: []
      };
    }
  }

  // Get weekly progress from activity subcollection
  static async getWeeklyProgress(userId: string) {
    try {
      const userRef = doc(db, 'users', userId);
      const activityRef = collection(userRef, 'activity');
      
      // Get activities from the last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const activityQuery = query(
        activityRef,
        where('timestamp', '>=', oneWeekAgo.toISOString()),
        orderBy('timestamp', 'desc')
      );
      
      const activitySnapshot = await getDocs(activityQuery);
      const activities = activitySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));

      // Group by day
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayActivities = activities.filter(activity => 
          activity.timestamp?.startsWith(dateStr)
        );
        
        weeklyData.push({
          date: dateStr,
          interviews: dayActivities.filter(a => a.type === 'interview_completed').length,
          score: dayActivities.length > 0 
            ? dayActivities.reduce((sum, a) => sum + (a.score || 0), 0) / dayActivities.length 
            : 0
        });
      }

      return weeklyData;
    } catch (error) {
      console.error('Error fetching weekly progress:', error);
      return [];
    }
  }

  // Get user achievements from subcollection
  static async getUserAchievements(userId: string) {
    try {
      const userRef = doc(db, 'users', userId);
      const achievementsRef = collection(userRef, 'achievements');
      const achievementsSnapshot = await getDocs(achievementsRef);
      const achievements = achievementsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));

      return achievements;
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      return [];
    }
  }

  // Get user activity from subcollection
  static async getUserActivity(userId: string, limitCount: number = 10) {
    try {
      const userRef = doc(db, 'users', userId);
      const activityRef = collection(userRef, 'activity');
      
      const activityQuery = query(
        activityRef,
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const activitySnapshot = await getDocs(activityQuery);
      const activities = activitySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));

      return activities;
    } catch (error) {
      console.error('Error fetching user activity:', error);
      return [];
    }
  }

  // Save interview result to user's activity subcollection
  static async saveInterviewResult(userId: string, interviewData: any) {
    try {
      const userRef = doc(db, 'users', userId);
      const activityRef = collection(userRef, 'activity');
      
      const activityData = {
        id: `interview-${Date.now()}`,
        userId: userId,
        type: 'interview_completed',
        title: `Completed ${interviewData.domain} Interview`,
        description: `Scored ${interviewData.score}% on ${interviewData.domain} domain`,
        timestamp: new Date().toISOString(),
        score: interviewData.score,
        domain: interviewData.domain,
        totalQuestions: interviewData.totalQuestions,
        correctAnswers: interviewData.correctAnswers,
        questionType: interviewData.questionType
      };

      await setDoc(doc(activityRef, activityData.id), activityData);

      // Update progress
      await this.updateUserProgress(userId, interviewData);

      // Also update denormalized stats on user document for quick dashboard reads
      try {
        const currentDate = new Date().toISOString();
        const userDocRef = doc(db, 'users', userId);
        // Read current user doc
        const cur = (await getDocs(collection(userRef, 'progress'))).docs
          .map((d) => d.data() as any);
        const totalInterviews = (await getDocs(collection(userRef, 'activity'))).docs
          .filter((d) => (d.data() as any).type === 'interview_completed').length;
        const answeredQuestions = cur.reduce((s, p) => s + (p.answeredQuestions || 0), 0);
        const totalQuestions = cur.reduce((s, p) => s + (p.totalQuestions || 0), 0);
        const avgScore = cur.length > 0 ? Math.round(cur.reduce((s, p) => s + (p.averageScore || 0), 0) / cur.length) : 0;
        await updateDoc(userDocRef, {
          stats: {
            totalInterviews,
            averageScore: avgScore,
            answeredQuestions,
            totalQuestions,
            updatedAt: currentDate,
          },
        });
      } catch (e) {
        console.warn('DashboardService: Failed to update denormalized user stats', e);
      }

      return activityData;
    } catch (error) {
      console.error('Error saving interview result:', error);
      throw error;
    }
  }

  // Update user progress in subcollection
  static async updateUserProgress(userId: string, interviewData: any) {
    try {
      const userRef = doc(db, 'users', userId);
      const progressRef = collection(userRef, 'progress');
      
      // Check if progress exists for this domain
      const progressQuery = query(progressRef, where('domain', '==', interviewData.domain));
      const progressSnapshot = await getDocs(progressQuery);
      
      if (progressSnapshot.empty) {
        // Create new progress record
        const newProgress = {
          id: `progress-${interviewData.domain.toLowerCase()}`,
          userId: userId,
          domain: interviewData.domain,
          totalQuestions: interviewData.totalQuestions,
          answeredQuestions: interviewData.totalQuestions,
          correctAnswers: interviewData.correctAnswers,
          averageScore: interviewData.score,
          lastUpdated: new Date().toISOString(),
          interviewsCompleted: 1
        };
        
        await setDoc(doc(progressRef, newProgress.id), newProgress);
      } else {
        // Update existing progress
        const existingProgress = progressSnapshot.docs[0];
        const currentData = existingProgress.data() as any;
        
        const updatedProgress = {
          ...currentData,
          totalQuestions: currentData.totalQuestions + interviewData.totalQuestions,
          answeredQuestions: currentData.answeredQuestions + interviewData.totalQuestions,
          correctAnswers: currentData.correctAnswers + interviewData.correctAnswers,
          averageScore: ((currentData.averageScore * currentData.interviewsCompleted) + interviewData.score) / (currentData.interviewsCompleted + 1),
          lastUpdated: new Date().toISOString(),
          interviewsCompleted: currentData.interviewsCompleted + 1
        };
        
        await updateDoc(doc(progressRef, existingProgress.id), updatedProgress);
      }

      // Keep a denormalized per-domain summary under the main user doc
      try {
        const domainKey = String(interviewData.domain || 'unknown')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
        const summaryPath = `progressSummary.${domainKey}`;
        await updateDoc(userRef, {
          [summaryPath]: {
            domain: interviewData.domain,
            lastUpdated: new Date().toISOString(),
            lastScore: interviewData.score,
          },
        } as any);
      } catch (e) {
        console.warn('DashboardService: Failed to update progressSummary on user doc', e);
      }
    } catch (error) {
      console.error('Error updating user progress:', error);
      throw error;
    }
  }

  // Award achievement to user
  static async awardAchievement(userId: string, achievementData: any) {
    try {
      const userRef = doc(db, 'users', userId);
      const achievementsRef = collection(userRef, 'achievements');
      
      const achievement = {
        id: achievementData.id || `achievement-${Date.now()}`,
        userId: userId,
        type: achievementData.type,
        title: achievementData.title,
        description: achievementData.description,
        earnedAt: new Date().toISOString(),
        icon: achievementData.icon || '🏆'
      };

      await setDoc(doc(achievementsRef, achievement.id), achievement);

      // Also append a denormalized copy inside the main user doc
      try {
        await updateDoc(userRef, {
          achievements: arrayUnion({
            id: achievement.id,
            type: achievement.type,
            title: achievement.title,
            description: achievement.description,
            earnedAt: achievement.earnedAt,
            icon: achievement.icon,
          }),
        });
      } catch (e) {
        console.warn('DashboardService: Failed to update denormalized achievements array', e);
      }
      return achievement;
    } catch (error) {
      console.error('Error awarding achievement:', error);
      throw error;
    }
  }

  // Get user statistics
  static async getUserStats(userId: string) {
    try {
      const [progress, achievements, activities] = await Promise.all([
        this.getUserProgress(userId),
        this.getUserAchievements(userId),
        this.getUserActivity(userId, 50)
      ]);

      const totalInterviews = activities.filter(a => a.type === 'interview_completed').length;
      const totalScore = activities
        .filter(a => a.type === 'interview_completed')
        .reduce((sum, a) => sum + (a.score || 0), 0);
      const averageScore = totalInterviews > 0 ? totalScore / totalInterviews : 0;

      return {
        totalInterviews,
        averageScore: Math.round(averageScore),
        totalAchievements: achievements.length,
        totalDomains: progress.totalDomains,
        totalQuestions: progress.totalQuestions,
        answeredQuestions: progress.answeredQuestions
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        totalInterviews: 0,
        averageScore: 0,
        totalAchievements: 0,
        totalDomains: 0,
        totalQuestions: 0,
        answeredQuestions: 0
      };
    }
  }
} 