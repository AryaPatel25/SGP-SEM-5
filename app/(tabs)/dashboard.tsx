import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { DashboardService } from '../../firebase/dashboardService';
import { useAuth } from '../../src/context/AuthContext';
import AchievementBadges from '../components/dashboard/AchievementBadges';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import ProgressChart from '../components/dashboard/ProgressChart';
import StatsCard from '../components/dashboard/StatsCard';
import WeeklyProgress from '../components/dashboard/WeeklyProgress';

// Wrapper component to safely handle auth context
function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<{
    totalInterviews: number;
    averageScore: number;
    questionsAnswered: number;
    timeSpent: number;
    weeklyProgress: { day: string; interviews: number; score: number }[];
    recentActivity: {
      id: string;
      type: 'interview_completed' | 'achievement_unlocked';
      domain?: string;
      score?: number;
      title?: string;
      description?: string;
      timestamp: Date;
    }[];
    achievements: {
      id: string;
      title: string;
      description: string;
      icon: string;
      unlocked: boolean;
      unlockedAt?: Date;
    }[];
  }>({
    totalInterviews: 0,
    averageScore: 0,
    questionsAnswered: 0,
    timeSpent: 0,
    weeklyProgress: [],
    recentActivity: [],
    achievements: [],
  });

  const loadDashboardData = useCallback(async () => {
    try {
      const userId = user?.id || 'user123';
      
      // Get data using the new service methods
      const [stats, progress, weeklyProgress, achievements, activities] = await Promise.all([
        DashboardService.getUserStats(userId),
        DashboardService.getUserProgress(userId),
        DashboardService.getWeeklyProgress(userId),
        DashboardService.getUserAchievements(userId),
        DashboardService.getUserActivity(userId, 5)
      ]);

      // Format activities for the dashboard
      const recentActivity = (activities as any[]).map((activity: any) => ({
        id: activity.id,
        type: activity.type === 'interview_completed' ? 'interview_completed' as const : 'achievement_unlocked' as const,
        domain: activity.domain,
        score: activity.score,
        title: activity.title,
        description: activity.description,
        timestamp: new Date(activity.timestamp),
      }));

      // Format achievements for the dashboard
      const formattedAchievements = (achievements as any[]).map((achievement: any) => ({
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        unlocked: true,
        unlockedAt: new Date(achievement.earnedAt),
      }));

      // Format weekly progress for the dashboard
      const formattedWeeklyProgress = (weeklyProgress as any[]).map((day: any) => ({
        day: new Date(day.date).toLocaleDateString('en', { weekday: 'short' }),
        interviews: day.interviews,
        score: Math.round(day.score)
      }));

      setDashboardData({
        totalInterviews: stats.totalInterviews,
        averageScore: stats.averageScore,
        questionsAnswered: stats.answeredQuestions,
        timeSpent: Math.round(stats.totalInterviews * 15), // Estimated time
        weeklyProgress: formattedWeeklyProgress,
        recentActivity,
        achievements: formattedAchievements,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      loadMockData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [loadDashboardData, user?.id]);

  // Refresh dashboard data when component comes into focus
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.id) {
        loadDashboardData();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [loadDashboardData, user?.id]);

  const loadMockData = () => {
    const mockData = {
      totalInterviews: 12,
      averageScore: 78,
      questionsAnswered: 156,
      timeSpent: 420,
      weeklyProgress: [
        { day: 'Mon', interviews: 2, score: 75 },
        { day: 'Tue', interviews: 1, score: 82 },
        { day: 'Wed', interviews: 3, score: 79 },
        { day: 'Thu', interviews: 2, score: 85 },
        { day: 'Fri', interviews: 1, score: 88 },
        { day: 'Sat', interviews: 2, score: 91 },
        { day: 'Sun', interviews: 1, score: 87 },
      ],
      recentActivity: [
        {
          id: '1',
          type: 'interview_completed' as const,
          domain: 'Frontend Development',
          score: 85,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          id: '2',
          type: 'achievement_unlocked' as const,
          title: 'First Perfect Score',
          description: 'Scored 100% in Backend Development',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        {
          id: '3',
          type: 'interview_completed' as const,
          domain: 'Data Science',
          score: 72,
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ],
      achievements: [
        {
          id: '1',
          title: 'First Interview',
          description: 'Complete your first interview',
          icon: '🎯',
          unlocked: true,
          unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        {
          id: '2',
          title: 'Perfect Score',
          description: 'Score 100% in any domain',
          icon: '⭐',
          unlocked: true,
          unlockedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        {
          id: '3',
          title: 'Domain Master',
          description: 'Complete 10 interviews in one domain',
          icon: '🏆',
          unlocked: false,
        },
        {
          id: '4',
          title: 'Consistent Learner',
          description: 'Practice for 7 consecutive days',
          icon: '📚',
          unlocked: false,
        },
        {
          id: '5',
          title: 'Speed Demon',
          description: 'Complete 5 interviews in one day',
          icon: '⚡',
          unlocked: false,
        },
        {
          id: '6',
          title: 'High Achiever',
          description: 'Maintain 90%+ average score',
          icon: '🎖️',
          unlocked: false,
        },
        {
          id: '7',
          title: 'Multi-Domain Expert',
          description: 'Complete interviews in 5 different domains',
          icon: '🌟',
          unlocked: false,
        },
        {
          id: '8',
          title: 'Marathon Runner',
          description: 'Spend 10+ hours practicing',
          icon: '🏃',
          unlocked: false,
        },
      ],
    };

    setDashboardData(mockData);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.fullName || 'User'} 👋</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadDashboardData}
        >
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <StatsCard
          title="Total Interviews"
          value={dashboardData.totalInterviews.toString()}
          icon="📊"
          color="#38bdf8"
        />
        <StatsCard
          title="Average Score"
          value={`${dashboardData.averageScore}%`}
          icon="📈"
          color="#22c55e"
        />
        <StatsCard
          title="Questions Answered"
          value={dashboardData.questionsAnswered.toString()}
          icon="❓"
          color="#f59e0b"
        />
        <StatsCard
          title="Time Spent"
          value={formatTime(dashboardData.timeSpent)}
          icon="⏱️"
          color="#8b5cf6"
        />
      </View>

      {/* Weekly Progress Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Progress</Text>
        <WeeklyProgress data={dashboardData.weeklyProgress} />
      </View>

      {/* Progress Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Domain Performance</Text>
        <ProgressChart />
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <ActivityFeed activities={dashboardData.recentActivity} />
      </View>

      {/* Achievement Badges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <AchievementBadges achievements={dashboardData.achievements} />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/interview')}
          >
            <Text style={styles.actionIcon}>🎯</Text>
            <Text style={styles.actionText}>Start Interview</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>View Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>🎓</Text>
            <Text style={styles.actionText}>Study Tips</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// Main dashboard component with safe auth handling
export default function DashboardScreen() {
  try {
    return <DashboardContent />;
  } catch (error) {
    console.log('Dashboard error:', error);
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Loading dashboard...</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#23272e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 18,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#23272e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
}); 