import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    where
} from 'firebase/firestore';
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
  // Get user progress
  static async getUserProgress(userId: string): Promise<UserProgress | null> {
    try {
      const docRef = doc(db, 'user_progress', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
        } as UserProgress;
      }
      
      // Create initial progress if doesn't exist
      const initialProgress: UserProgress = {
        userId,
        totalInterviews: 0,
        averageScore: 0,
        questionsAnswered: 0,
        timeSpent: 0,
        lastUpdated: new Date(),
        domainScores: {},
      };
      
      await setDoc(docRef, initialProgress);
      return initialProgress;
    } catch (error) {
      console.error('Error getting user progress:', error);
      return null;
    }
  }

  // Update user progress after interview completion
  static async updateUserProgress(
    userId: string,
    interviewData: {
      domain: string;
      score: number;
      totalQuestions: number;
      correctAnswers: number;
      timeSpent: number;
    }
  ): Promise<void> {
    try {
      const progressRef = doc(db, 'user_progress', userId);
      const progressSnap = await getDoc(progressRef);
      
      let currentProgress: UserProgress;
      if (progressSnap.exists()) {
        currentProgress = progressSnap.data() as UserProgress;
      } else {
        currentProgress = {
          userId,
          totalInterviews: 0,
          averageScore: 0,
          questionsAnswered: 0,
          timeSpent: 0,
          lastUpdated: new Date(),
          domainScores: {},
        };
      }

      // Update progress
      const newTotalInterviews = currentProgress.totalInterviews + 1;
      const newQuestionsAnswered = currentProgress.questionsAnswered + interviewData.totalQuestions;
      const newTimeSpent = currentProgress.timeSpent + interviewData.timeSpent;
      
      // Calculate new average score
      const totalScore = (currentProgress.averageScore * currentProgress.totalInterviews) + interviewData.score;
      const newAverageScore = totalScore / newTotalInterviews;

      // Update domain scores
      const domainScores = { ...currentProgress.domainScores };
      if (!domainScores[interviewData.domain]) {
        domainScores[interviewData.domain] = {
          totalInterviews: 0,
          averageScore: 0,
          bestScore: 0,
        };
      }

      const domainScore = domainScores[interviewData.domain];
      const newDomainInterviews = domainScore.totalInterviews + 1;
      const newDomainAverage = ((domainScore.averageScore * domainScore.totalInterviews) + interviewData.score) / newDomainInterviews;
      const newDomainBest = Math.max(domainScore.bestScore, interviewData.score);

      domainScores[interviewData.domain] = {
        totalInterviews: newDomainInterviews,
        averageScore: newDomainAverage,
        bestScore: newDomainBest,
      };

      const updatedProgress: UserProgress = {
        ...currentProgress,
        totalInterviews: newTotalInterviews,
        averageScore: newAverageScore,
        questionsAnswered: newQuestionsAnswered,
        timeSpent: newTimeSpent,
        lastUpdated: new Date(),
        domainScores,
      };

      await setDoc(progressRef, updatedProgress);
    } catch (error) {
      console.error('Error updating user progress:', error);
    }
  }

  // Save interview session
  static async saveInterviewSession(session: Omit<InterviewSession, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'interview_sessions'), {
        ...session,
        completedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving interview session:', error);
      throw error;
    }
  }

  // Get recent interview sessions
  static async getRecentSessions(userId: string, limitCount: number = 10): Promise<InterviewSession[]> {
    try {
      const q = query(
        collection(db, 'interview_sessions'),
        where('userId', '==', userId),
        orderBy('completedAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate() || new Date(),
      })) as InterviewSession[];
    } catch (error) {
      console.error('Error getting recent sessions:', error);
      return [];
    }
  }

  // Get user achievements
  static async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      const docRef = doc(db, 'user_achievements', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return Object.values(data.achievements || {}).map((achievement: any) => ({
          ...achievement,
          unlockedAt: achievement.unlockedAt?.toDate(),
        })) as Achievement[];
      }
      
      return [];
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return [];
    }
  }

  // Check and unlock achievements
  static async checkAchievements(userId: string, progress: UserProgress): Promise<Achievement[]> {
    try {
      const achievements = await this.getDefaultAchievements();
      const userAchievements = await this.getUserAchievements(userId);
      const unlockedAchievements: Achievement[] = [];

      for (const achievement of achievements) {
        const userAchievement = userAchievements.find(ua => ua.id === achievement.id);
        
        if (userAchievement?.unlocked) continue;

        let shouldUnlock = false;

        switch (achievement.criteria.type) {
          case 'interviews_completed':
            shouldUnlock = progress.totalInterviews >= achievement.criteria.value;
            break;
          case 'score_threshold':
            shouldUnlock = progress.averageScore >= achievement.criteria.value;
            break;
          case 'domain_mastery':
            if (achievement.criteria.domain) {
              const domainScore = progress.domainScores[achievement.criteria.domain];
              shouldUnlock = domainScore && domainScore.totalInterviews >= achievement.criteria.value;
            }
            break;
        }

        if (shouldUnlock) {
          const unlockedAchievement: Achievement = {
            ...achievement,
            unlocked: true,
            unlockedAt: new Date(),
          };
          unlockedAchievements.push(unlockedAchievement);
        }
      }

      // Save unlocked achievements
      if (unlockedAchievements.length > 0) {
        await this.saveUserAchievements(userId, [...userAchievements, ...unlockedAchievements]);
      }

      return unlockedAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  // Get default achievements
  static async getDefaultAchievements(): Promise<Achievement[]> {
    return [
      {
        id: 'first_interview',
        title: 'First Interview',
        description: 'Complete your first interview',
        icon: '🎯',
        criteria: { type: 'interviews_completed', value: 1 },
        unlocked: false,
      },
      {
        id: 'perfect_score',
        title: 'Perfect Score',
        description: 'Score 100% in any domain',
        icon: '⭐',
        criteria: { type: 'score_threshold', value: 100 },
        unlocked: false,
      },
      {
        id: 'domain_master',
        title: 'Domain Master',
        description: 'Complete 10 interviews in one domain',
        icon: '🏆',
        criteria: { type: 'domain_mastery', value: 10 },
        unlocked: false,
      },
      {
        id: 'consistent_learner',
        title: 'Consistent Learner',
        description: 'Complete 5 interviews in a week',
        icon: '📚',
        criteria: { type: 'interviews_completed', value: 5 },
        unlocked: false,
      },
      {
        id: 'speed_demon',
        title: 'Speed Demon',
        description: 'Complete 3 interviews in one day',
        icon: '⚡',
        criteria: { type: 'interviews_completed', value: 3 },
        unlocked: false,
      },
    ];
  }

  // Save user achievements
  static async saveUserAchievements(userId: string, achievements: Achievement[]): Promise<void> {
    try {
      const achievementsMap = achievements.reduce((acc, achievement) => {
        acc[achievement.id] = achievement;
        return acc;
      }, {} as Record<string, Achievement>);

      await setDoc(doc(db, 'user_achievements', userId), {
        userId,
        achievements: achievementsMap,
        lastUpdated: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error saving user achievements:', error);
    }
  }

  // Get user activity feed
  static async getUserActivity(userId: string, limitCount: number = 10): Promise<UserActivity[]> {
    try {
      // For now, return mock data to avoid Firebase index issues
      // TODO: Implement proper activity feed when Firebase indexes are set up
      return [
        {
          id: '1',
          userId,
          type: 'interview_completed',
          title: 'Completed Frontend Development Interview',
          description: 'Scored 85% in Frontend Development',
          metadata: {
            domain: 'Frontend Development',
            score: 85,
            questionType: 'quiz',
          },
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
          id: '2',
          userId,
          type: 'achievement_unlocked',
          title: 'First Perfect Score',
          description: 'Scored 100% in Backend Development',
          metadata: {
            achievementId: 'perfect_score',
            icon: '⭐',
          },
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        },
        {
          id: '3',
          userId,
          type: 'interview_completed',
          title: 'Completed Data Science Interview',
          description: 'Scored 72% in Data Science',
          metadata: {
            domain: 'Data Science',
            score: 72,
            questionType: 'descriptive',
          },
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
      ];
    } catch (error) {
      console.error('Error getting user activity:', error);
      return [];
    }
  }

  // Add user activity
  static async addUserActivity(activity: Omit<UserActivity, 'id'>): Promise<void> {
    try {
      await addDoc(collection(db, 'user_activity'), {
        ...activity,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error adding user activity:', error);
    }
  }

  // Get weekly progress data
  static async getWeeklyProgress(userId: string): Promise<Array<{ day: string; interviews: number; score: number }>> {
    try {
      // For now, return mock data to avoid Firebase index issues
      // TODO: Implement proper weekly progress when Firebase indexes are set up
      return [
        { day: 'Mon', interviews: 2, score: 75 },
        { day: 'Tue', interviews: 1, score: 82 },
        { day: 'Wed', interviews: 3, score: 79 },
        { day: 'Thu', interviews: 2, score: 85 },
        { day: 'Fri', interviews: 1, score: 88 },
        { day: 'Sat', interviews: 2, score: 91 },
        { day: 'Sun', interviews: 1, score: 87 },
      ];
    } catch (error) {
      console.error('Error getting weekly progress:', error);
      return [];
    }
  }
} 