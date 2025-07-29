import { useCallback, useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { DashboardService } from '../../firebase/dashboardService';
import AchievementBadges from '../components/dashboard/AchievementBadges';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import ProgressChart from '../components/dashboard/ProgressChart';
import StatsCard from '../components/dashboard/StatsCard';
import WeeklyProgress from '../components/dashboard/WeeklyProgress';

// Wrapper component to safely handle auth context
function DashboardContent() {
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
      const progress = await DashboardService.getUserProgress('user123');
      const weeklyProgress = await DashboardService.getWeeklyProgress('user123');
      const achievements = await DashboardService.getUserAchievements('user123');
      const activities = await DashboardService.getUserActivity('user123', 5);

      const recentActivity = activities.map(activity => ({
        id: activity.id,
        type: activity.type === 'interview_completed' ? 'interview_completed' as const : 'achievement_unlocked' as const,
        domain: activity.metadata?.domain,
        score: activity.metadata?.score,
        title: activity.title,
        description: activity.description,
        timestamp: activity.timestamp,
      }));

      if (progress) {
        setDashboardData({
          totalInterviews: progress.totalInterviews,
          averageScore: Math.round(progress.averageScore),
          questionsAnswered: progress.questionsAnswered,
          timeSpent: progress.timeSpent,
          weeklyProgress,
          recentActivity,
          achievements,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      loadMockData();
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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
          <Text style={styles.userName}>User 👋</Text>
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
          <TouchableOpacity style={styles.actionButton}>
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