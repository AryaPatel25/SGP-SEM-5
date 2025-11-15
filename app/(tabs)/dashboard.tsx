import { Ionicons } from '@expo/vector-icons';
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
        interviews: day.interviews || 0,
        score: Math.round(day.score || 0)
      }));

      // Calculate total interviews including mock interviews
      const totalInterviewsIncludingMock = stats.totalInterviews + mockCount;
      
      // Calculate time spent: regular interviews (15 min each) + mock interviews (estimated 5 min per question)
      const mockTimeSpent = mockSessions.reduce((total: number, session: any) => {
        const questionCount = session.totalQuestions || (session.questions?.length || 0);
        return total + (questionCount * 5); // 5 minutes per question
      }, 0);
      const regularTimeSpent = stats.totalInterviews * 15;
      const totalTimeSpent = Math.round(regularTimeSpent + mockTimeSpent);

      // Calculate average score including mock interviews
      const interviewScores = (activities as any[])
        .filter((a: any) => a.type === 'interview_completed')
        .map((a: any) => typeof a.score === 'number' ? a.score : null)
        .filter((s: any) => s !== null) as number[];
      const mockScores = mockSessions
        .map((s: any) => s.averageScore)
        .filter((s: any) => typeof s === 'number' && s > 0)
        .map((s: number) => (s / 10) * 100); // Convert from 0-10 scale to 0-100
      const allScores = [...interviewScores, ...mockScores];
      const overallAverageScore = allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : stats.averageScore;

      setDashboardData({
        totalInterviews: totalInterviewsIncludingMock,
        averageScore: overallAverageScore,
        questionsAnswered: stats.answeredQuestions,
        timeSpent: totalTimeSpent,
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

  const ProgressRing = ({ percentage, size = 70 }: { percentage: number; size?: number }) => {
    const normalized = Math.max(0, Math.min(100, percentage));
    const rotation = (normalized / 100) * 360 - 90;

    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        {/* Background circle */}
        <View style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 6,
          borderColor: 'rgba(255,255,255,0.1)',
          position: 'absolute',
        }} />
        {/* Progress arc using a half-circle approach */}
        {normalized > 0 && (
          <View style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 6,
            borderColor: '#22c55e',
            borderTopColor: normalized >= 50 ? '#22c55e' : 'transparent',
            borderRightColor: normalized > 0 ? '#22c55e' : 'transparent',
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
            transform: [{ rotate: `${rotation}deg` }],
            position: 'absolute',
          }} />
        )}
        {normalized > 50 && (
          <View style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 6,
            borderColor: '#22c55e',
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: '#22c55e',
            borderLeftColor: '#22c55e',
            transform: [{ rotate: `${rotation - 180}deg` }],
            position: 'absolute',
          }} />
        )}
        <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '800' }}>{normalized}%</Text>
      </View>
    );
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
          <View style={styles.heroTextContainer}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>
              {user?.fullName?.trim() || (user?.email ? user.email.split('@')[0] : 'User')} 👋
            </Text>
            <Text style={styles.heroSubtitle}>Track your progress and keep improving</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={loadDashboardData}>
            <Ionicons name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Key Metrics Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeaderTitle}>📊 Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <GlassCard style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="chatbubbles" size={28} color={Theme.dark.accent} />
            </View>
            <Text style={styles.metricValue}>{dashboardData.totalInterviews}</Text>
            <Text style={styles.metricLabel}>Interviews</Text>
          </GlassCard>
          <GlassCard style={styles.metricCard}>
            <ProgressRing percentage={dashboardData.averageScore} size={70} />
            <Text style={styles.metricLabel}>Avg Score</Text>
          </GlassCard>
          <GlassCard style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="time" size={28} color={Theme.dark.accent} />
            </View>
            <Text style={styles.metricValue}>{formatTime(dashboardData.timeSpent)}</Text>
            <Text style={styles.metricLabel}>Time Spent</Text>
          </GlassCard>
          <GlassCard style={styles.metricCard}>
            <View style={styles.sparklineContainer}>
              {dashboardData.weeklyProgress.map((d, idx) => (
                <View key={idx} style={styles.sparkCol}>
                  <View style={[styles.sparkBar, { height: Math.max(8, Math.min(40, Math.round((d.score || 0) * 0.4))) }]} />
                  <Text style={styles.sparkLabel}>{d.day.slice(0,1)}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.metricLabel}>Active Days</Text>
          </GlassCard>
        </View>
      </View>

      {/* Highlights moved to Reports. Keep Dashboard lightweight */}

      {/* Today's Tips */}
      <View style={styles.section}>
        <GlassCard>
          <View style={styles.tipHeader}>
            <Text style={styles.sectionTitle}>💡 Today's Tips</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>Focus one domain per session for better retention</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>Aim for short, consistent practice (20–30 minutes)</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>Review incorrect answers and write brief takeaways</Text>
            </View>
          </View>
        </GlassCard>
      </View>

      {/* Recent Activity */}
      {dashboardData.recentActivity.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeaderTitle}>📈 Recent Activity</Text>
          <GlassCard>
            {dashboardData.recentActivity.slice(0, 3).map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIconContainer}>
                  <Ionicons 
                    name={activity.type === 'interview_completed' ? 'checkmark-circle' : 'trophy'} 
                    size={24} 
                    color={Theme.dark.accent} 
                  />
                </View>
                <View style={styles.activityContent}>
                  {activity.type === 'interview_completed' ? (
                    <>
                      <Text 
                        style={styles.activityTitle}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        Completed <Text style={styles.domainText}>{activity.domain}</Text> Interview
                      </Text>
                      <Text style={styles.activitySubtitle}>
                        Score: {activity.score}% • {new Date(activity.timestamp).toLocaleDateString()}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <Text style={styles.activitySubtitle}>{activity.description}</Text>
                    </>
                  )}
                </View>
              </View>
            ))}
          </GlassCard>
        </View>
      )}

      {/* Goals */}
      <View style={styles.section}>
        <GlassCard>
          <View style={styles.goalHeader}>
            <Text style={styles.sectionTitle}>🎯 Your Goals</Text>
          </View>
          <View style={styles.goalsList}>
            <View style={styles.goalItem}>
              <View style={styles.goalCheckbox}>
                <Text style={styles.goalCheck}>✓</Text>
              </View>
              <Text style={styles.goalText}>Complete 2 interviews this week</Text>
            </View>
            <View style={styles.goalItem}>
              <View style={styles.goalCheckbox}>
                <Text style={styles.goalCheck}>✓</Text>
              </View>
              <Text style={styles.goalText}>Reach 80%+ average in your primary domain</Text>
            </View>
            <View style={styles.goalItem}>
              <View style={styles.goalCheckbox}>
                <Text style={styles.goalCheck}>✓</Text>
              </View>
              <Text style={styles.goalText}>Practice 3 days in a row to build a streak</Text>
            </View>
          </View>
        </GlassCard>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionHeaderTitle}>⚡ Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.actionPrimary]}
            onPress={() => router.push('/(tabs)/interview')}
          >
            <LinearGradient
              colors={Theme.dark.gradient.primary as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="chatbubbles" size={24} color="#fff" />
              <Text style={styles.actionText}>Start Interview</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.actionSecondary]}
            onPress={() => router.push('/(tabs)/reports')}
          >
            <LinearGradient
              colors={['#10b981', '#059669'] as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="stats-chart" size={24} color="#fff" />
              <Text style={styles.actionText}>View Reports</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.actionTertiary]}
            onPress={() => router.push('/(tabs)/tips-resources')}
          >
            <LinearGradient
              colors={['#a855f7', '#9333ea'] as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="bulb" size={24} color="#fff" />
              <Text style={styles.actionText}>Study Tips</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Achievements & Badges */}
      <View style={styles.section}>
        <Text style={styles.sectionHeaderTitle}>🏆 Achievements & Badges</Text>
        <GlassCard>
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
    backgroundColor: Theme.dark.background,
  },
  hero: {
    marginTop: 24,
    marginBottom: 24,
    padding: 24,
    paddingTop: 60,
    borderRadius: 0,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  metricIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Theme.dark.textPrimary,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: Theme.dark.textSecondary,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  sparklineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 50,
    marginBottom: 8,
  },
  sparkCol: {
    alignItems: 'center',
    flex: 1,
  },
  sparkBar: {
    width: 8,
    backgroundColor: Theme.dark.accent,
    borderRadius: 4,
    marginBottom: 4,
  },
  sparkLabel: {
    color: Theme.dark.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.dark.textPrimary,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.dark.textPrimary,
    marginBottom: 16,
  },
  quickActions: {
    gap: 12,
    flexDirection: 'column',
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 0,
  },
  actionButtonGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  actionText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.dark.border,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.dark.textPrimary,
    marginBottom: 4,
    lineHeight: 20,
  },
  domainText: {
    fontWeight: '700',
    color: Theme.dark.accent,
  },
  activitySubtitle: {
    fontSize: 13,
    color: Theme.dark.textSecondary,
  },
  tipHeader: {
    marginBottom: 12,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.dark.accent,
  },
  tipText: {
    color: Theme.dark.textPrimary,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  goalHeader: {
    marginBottom: 12,
  },
  goalsList: {
    gap: 12,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.dark.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalCheck: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  goalText: {
    color: Theme.dark.textPrimary,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
}); 