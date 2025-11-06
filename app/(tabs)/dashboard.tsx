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
import StatsCard from '../components/dashboard/StatsCard';
// Reports and deeper analytics moved to Reports tab
import { LinearGradient } from 'expo-linear-gradient';
import { collection, doc, getDocs } from 'firebase/firestore';
import GlassCard from '../../components/ui/GlassCard';
import { Theme } from '../../constants/Colors';
import { db } from '../../firebase/firebaseConfig';

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
      const [stats, weeklyProgress, achievements, activities, progress, mockSessions] = await Promise.all([
        DashboardService.getUserStats(userId),
        // DashboardService.getUserProgress(userId), // Unused for now
        DashboardService.getWeeklyProgress(userId),
        DashboardService.getUserAchievements(userId),
        DashboardService.getUserActivity(userId, 50),
        DashboardService.getUserProgress(userId),
        (async () => {
          try {
            const userRef = doc(db, 'users', userId);
            const mockRef = collection(userRef, 'mockInterviews');
            const snap = await getDocs(mockRef);
            return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
          } catch { return []; }
        })()
      ]);

      // Format activities for the dashboard
      const recentActivity = (activities as any[]).slice(0, 5).map((activity: any) => ({
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

      // Build logical, motivating badge catalog combining earned and locked
      const uniqueActiveDays = new Set(
        (activities as any[])
          .filter((a: any) => a.type === 'interview_completed')
          .map((a: any) => String(a.timestamp).slice(0, 10))
      ).size;
      const domainsPracticed = (progress?.domainProgress || []).length || 0;
      const earnedSet = new Set((achievements as any[]).map((a: any) => a.title));
      const mockCount = Array.isArray(mockSessions) ? mockSessions.length : 0;
      const byDayCount: Record<string, number> = {};
      (activities as any[])
        .filter((a: any) => a.type === 'interview_completed')
        .forEach((a: any) => {
          const day = String(a.timestamp).slice(0, 10);
          byDayCount[day] = (byDayCount[day] || 0) + 1;
        });
      const maxInADay = Object.values(byDayCount).reduce((m, x) => Math.max(m, x as number), 0);

      const catalog: Array<{ id: string; title: string; description: string; icon: string; unlocked: boolean; unlockedAt?: Date }>
        = [
        {
          id: 'first-interview',
          title: 'First Interview',
          description: 'Complete your first interview',
          icon: '🎯',
          unlocked: stats.totalInterviews >= 1,
          unlockedAt: undefined,
        },
        {
          id: 'consistency-starter',
          title: 'Consistency Starter',
          description: 'Practice on 3 different days this week',
          icon: '📅',
          unlocked: uniqueActiveDays >= 3,
        },
        {
          id: 'streak-builder',
          title: 'Streak Builder',
          description: 'Practice on 5 different days this week',
          icon: '🧱',
          unlocked: uniqueActiveDays >= 5,
        },
        {
          id: 'streak-master',
          title: 'Streak Master',
          description: 'Practice on 7 days this week',
          icon: '🥇',
          unlocked: uniqueActiveDays >= 7,
        },
        {
          id: 'on-a-roll',
          title: 'On a Roll',
          description: 'Complete 5 interviews',
          icon: '🔥',
          unlocked: stats.totalInterviews >= 5,
        },
        {
          id: 'high-achiever',
          title: 'High Achiever',
          description: 'Reach an average score of 80%+',
          icon: '🎖️',
          unlocked: stats.averageScore >= 80,
        },
        {
          id: 'domain-explorer',
          title: 'Domain Explorer',
          description: 'Practice in 3 different domains',
          icon: '🌟',
          unlocked: domainsPracticed >= 3,
        },
        {
          id: 'mock-novice',
          title: 'Mock Novice',
          description: 'Complete 3 mock interview sessions',
          icon: '🎬',
          unlocked: mockCount >= 3,
        },
        {
          id: 'mock-pro',
          title: 'Mock Pro',
          description: 'Complete 10 mock interview sessions',
          icon: '🎥',
          unlocked: mockCount >= 10,
        },
        {
          id: 'sprinter',
          title: 'Sprinter',
          description: 'Complete 3 interviews in a single day',
          icon: '⚡',
          unlocked: maxInADay >= 3,
        },
        {
          id: 'weekend-warrior',
          title: 'Weekend Warrior',
          description: 'Complete 2 interviews on a weekend',
          icon: '🛡️',
          unlocked: (weeklyProgress || []).some((d: any, idx: number) => {
            // treat last two entries as weekend for display purposes
            return idx >= (weeklyProgress.length - 2) && d.interviews >= 2;
          }),
        },
      ];

      // Merge earned achievements with catalog, prefer earned metadata
      const mergedAchievements = catalog.map((badge) => {
        const earned = (achievements as any[]).find((a: any) => a.title === badge.title);
        return earned
          ? {
              id: earned.id,
              title: earned.title,
              description: earned.description,
              icon: earned.icon || badge.icon,
              unlocked: true,
              unlockedAt: new Date(earned.earnedAt),
            }
          : badge;
      });

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
        achievements: mergedAchievements,
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
      {/* Hero Header */}
      <LinearGradient
        colors={[Theme.dark.gradient.primary[0], Theme.dark.gradient.primary[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.fullName || (user?.email ? user.email.split('@')[0] : 'User')} 👋</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={loadDashboardData}>
            <Text style={styles.refreshButtonText}>🔄</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.heroChips}>
          <View style={styles.chip}><Text style={styles.chipText}>Interviews: {dashboardData.totalInterviews}</Text></View>
          <View style={styles.chip}><Text style={styles.chipText}>Avg: {dashboardData.averageScore}%</Text></View>
          <View style={styles.chip}><Text style={styles.chipText}>Time: {formatTime(dashboardData.timeSpent)}</Text></View>
        </View>
      </LinearGradient>

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

      {/* Highlights moved to Reports. Keep Dashboard lightweight */}

      {/* Today's Tips */}
      <View style={styles.section}>
        <GlassCard>
          <Text style={styles.sectionTitle}>Today's Tips</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>• Focus one domain per session for better retention.</Text>
            <Text style={styles.tipText}>• Aim for short, consistent practice (20–30 minutes).</Text>
            <Text style={styles.tipText}>• Review incorrect answers and write brief takeaways.</Text>
          </View>
        </GlassCard>
      </View>

      {/* Goals */}
      <View style={styles.section}>
        <GlassCard>
          <Text style={styles.sectionTitle}>Goals</Text>
          <View style={styles.goalsList}>
            <View style={styles.goalItem}>
              <Text style={styles.actionIcon}>✅</Text>
              <Text style={styles.goalText}>Complete 2 interviews this week</Text>
            </View>
            <View style={styles.goalItem}>
              <Text style={styles.actionIcon}>✅</Text>
              <Text style={styles.goalText}>Reach 80%+ average in your primary domain</Text>
            </View>
            <View style={styles.goalItem}>
              <Text style={styles.actionIcon}>✅</Text>
              <Text style={styles.goalText}>Practice 3 days in a row to build a streak</Text>
            </View>
          </View>
        </GlassCard>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <GlassCard>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.actionPrimary]}
              onPress={() => router.push('/(tabs)/interview')}
            >
              <Text style={styles.actionIcon}>🎯</Text>
              <Text style={styles.actionText}>Start Interview</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.actionSecondary]}
              onPress={() => router.push('/(tabs)/reports')}
            >
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionText}>View Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionTertiary]}>
              <Text style={styles.actionIcon}>🎓</Text>
              <Text style={styles.actionText}>Study Tips</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </View>

      {/* Achievements & Badges */}
      <View style={styles.section}>
        <GlassCard>
          <Text style={styles.sectionTitle}>Achievements & Badges</Text>
          <AchievementBadges achievements={dashboardData.achievements} />
        </GlassCard>
      </View>
    </ScrollView>
  );
}

// Main dashboard component with safe auth handling
export default function DashboardScreen() {
  return <DashboardContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0f11',
    paddingHorizontal: 16,
  },
  hero: {
    marginTop: 24,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroChips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  greeting: {
    fontSize: 16,
    color: '#e5e7eb',
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
    backgroundColor: 'rgba(0,0,0,0.25)',
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
  actionPrimary: {
    backgroundColor: '#0b5cff',
  },
  actionSecondary: {
    backgroundColor: '#10b981',
  },
  actionTertiary: {
    backgroundColor: '#a855f7',
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
  tipCard: {
    backgroundColor: '#23272e',
    padding: 16,
    borderRadius: 12,
    gap: 6,
  },
  tipText: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  goalsList: {
    backgroundColor: '#23272e',
    padding: 12,
    borderRadius: 12,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  goalText: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
}); 