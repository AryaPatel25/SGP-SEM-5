// seedDashboardData.js
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "./firebaseConfig.node.js";

// Seed default achievements
const seedDefaultAchievements = async () => {
  const achievements = [
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
    {
      id: 'quiz_master',
      title: 'Quiz Master',
      description: 'Complete 20 quiz questions',
      icon: '🧠',
      criteria: { type: 'interviews_completed', value: 20 },
      unlocked: false,
    },
    {
      id: 'frontend_expert',
      title: 'Frontend Expert',
      description: 'Master Frontend Development domain',
      icon: '💻',
      criteria: { type: 'domain_mastery', value: 15, domain: 'Frontend Development' },
      unlocked: false,
    },
    {
      id: 'backend_expert',
      title: 'Backend Expert',
      description: 'Master Backend Development domain',
      icon: '⚙️',
      criteria: { type: 'domain_mastery', value: 15, domain: 'Backend Development' },
      unlocked: false,
    },
  ];

  for (const achievement of achievements) {
    const achievementRef = doc(collection(db, "achievements"), achievement.id);
    await setDoc(achievementRef, achievement);
    console.log(`Added achievement: ${achievement.title}`);
  }
};

// Seed sample user progress (for testing)
const seedSampleUserProgress = async () => {
  const userId = "demo-user-001";
  const progressRef = doc(db, "user_progress", userId);
  
  const sampleProgress = {
    userId,
    totalInterviews: 8,
    averageScore: 78,
    questionsAnswered: 120,
    timeSpent: 240, // 4 hours
    lastUpdated: new Date(),
    domainScores: {
      'Frontend Development': {
        totalInterviews: 3,
        averageScore: 85,
        bestScore: 92,
      },
      'Backend Development': {
        totalInterviews: 2,
        averageScore: 72,
        bestScore: 88,
      },
      'Data Science': {
        totalInterviews: 2,
        averageScore: 68,
        bestScore: 75,
      },
      'DevOps': {
        totalInterviews: 1,
        averageScore: 65,
        bestScore: 65,
      },
    },
  };
  
  await setDoc(progressRef, sampleProgress);
  console.log(`Added sample user progress for: ${userId}`);
};

// Seed sample user achievements
const seedSampleUserAchievements = async () => {
  const userId = "demo-user-001";
  const achievementsRef = doc(db, "user_achievements", userId);
  
  const userAchievements = {
    userId,
    achievements: {
      'first_interview': {
        id: 'first_interview',
        title: 'First Interview',
        description: 'Complete your first interview',
        icon: '🎯',
        criteria: { type: 'interviews_completed', value: 1 },
        unlocked: true,
        unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      },
      'consistent_learner': {
        id: 'consistent_learner',
        title: 'Consistent Learner',
        description: 'Complete 5 interviews in a week',
        icon: '📚',
        criteria: { type: 'interviews_completed', value: 5 },
        unlocked: true,
        unlockedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
    },
    lastUpdated: new Date(),
  };
  
  await setDoc(achievementsRef, userAchievements);
  console.log(`Added sample user achievements for: ${userId}`);
};

// Seed sample activity feed
const seedSampleActivity = async () => {
  const userId = "demo-user-001";
  
  const activities = [
    {
      userId,
      type: 'interview_completed',
      title: 'Completed Frontend Development Interview',
      description: 'Scored 92% in Frontend Development',
      metadata: {
        domain: 'Frontend Development',
        score: 92,
        questionType: 'quiz',
      },
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      userId,
      type: 'achievement_unlocked',
      title: 'Consistent Learner',
      description: 'Complete 5 interviews in a week',
      metadata: {
        achievementId: 'consistent_learner',
        icon: '📚',
      },
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      userId,
      type: 'interview_completed',
      title: 'Completed Backend Development Interview',
      description: 'Scored 88% in Backend Development',
      metadata: {
        domain: 'Backend Development',
        score: 88,
        questionType: 'descriptive',
      },
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  ];
  
  for (const activity of activities) {
    const activityRef = doc(collection(db, "user_activity"));
    await setDoc(activityRef, activity);
    console.log(`Added activity: ${activity.title}`);
  }
};

// Run all seeders
const runSeeders = async () => {
  try {
    console.log('Starting dashboard data seeding...');
    
    await seedDefaultAchievements();
    await seedSampleUserProgress();
    await seedSampleUserAchievements();
    await seedSampleActivity();
    
    console.log('Dashboard data seeding complete!');
  } catch (error) {
    console.error('Error seeding dashboard data:', error);
  }
};

runSeeders(); 