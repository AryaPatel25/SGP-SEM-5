import { Ionicons } from '@expo/vector-icons';
// Sharing/export features removed as requested
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import GlassCard from '../../components/ui/GlassCard';
import { Theme } from '../../constants/Colors';
import { DashboardService } from '../../firebase/dashboardService';
import { useAuth } from '../../src/context/AuthContext';

interface ReportData {
  performanceAnalytics: any;
  activityTimeline: any[];
  domainProgress: any[];
  weeklyStats: any[];
  achievements: any[];
}

export default function ReportsScreen() {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<string>('performance');
  const [recommended, setRecommended] = useState<Array<{title: string; description: string; action: string; icon?: string}>>([]);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const userId = user?.id || 'user123';
      
      const [statsRes, activityTimeline, progressRes, weeklyRes, achievements, recs] = await Promise.all([
        DashboardService.getUserStats(userId),
        DashboardService.getUserActivity(userId, 50),
        DashboardService.getUserProgress(userId),
        DashboardService.getWeeklyProgress(userId),
        DashboardService.getUserAchievements(userId),
        DashboardService.getRecommendedAchievements(userId),
      ]);

      // Normalize domain progress shape expected by the Reports UI
      const domainProgress = (progressRes?.domainProgress || []).map((p: any) => ({
        name: p.domain,
        score: Math.round(p.averageScore || 0),
        questionsAttempted: p.answeredQuestions ?? p.totalQuestions ?? 0,
        lastPracticed: p.lastUpdated,
      }));

      // Normalize weekly stats shape expected by the Reports UI
      const weeklyStats = (weeklyRes || []).map((w: any) => ({
        interviews: w.interviews || 0,
        averageScore: Math.round(w.score || 0),
        timeSpent: (w.interviews || 0) * 15, // rough estimate 15m per interview
      }));

      setReportData({
        performanceAnalytics: statsRes,
        activityTimeline,
        domainProgress,
        weeklyStats,
        achievements,
      });
      setRecommended(recs || []);
    } catch (error) {
      console.error('Error loading report data:', error);
      Alert.alert('Error', 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const generateReportText = (reportType: string) => {
    if (!reportData) return '';

    const currentDate = new Date().toLocaleDateString();
    let report = `InterviewX Performance Report\nGenerated on: ${currentDate}\n\n`;

    switch (reportType) {
      case 'performance':
        const stats = reportData.performanceAnalytics;
        report += `PERFORMANCE ANALYTICS\n`;
        report += `========================\n`;
        report += `Total Interviews: ${stats.totalInterviews || 0}\n`;
        report += `Average Score: ${stats.averageScore || 0}%\n`;
        report += `Best Score: ${stats.bestScore || 0}%\n`;
        report += `Improvement Rate: ${stats.improvementRate || 0}%\n`;
        report += `Streak: ${stats.currentStreak || 0} days\n\n`;
        break;

      case 'activity':
        report += `ACTIVITY TIMELINE\n`;
        report += `==================\n`;
        reportData.activityTimeline.slice(0, 10).forEach((activity, index) => {
          report += `${index + 1}. ${activity.type}: ${activity.description}\n`;
          report += `   Date: ${new Date(activity.timestamp).toLocaleDateString()}\n`;
          report += `   Score: ${activity.score || 'N/A'}%\n\n`;
        });
        break;

      case 'domains':
        report += `DOMAIN PROGRESS\n`;
        report += `================\n`;
        reportData.domainProgress.forEach((domain, index) => {
          report += `${domain.name}: ${domain.score}%\n`;
          report += `Questions Attempted: ${domain.questionsAttempted}\n`;
          report += `Last Practice: ${new Date(domain.lastPracticed).toLocaleDateString()}\n\n`;
        });
        break;

      case 'weekly':
        report += `WEEKLY STATISTICS\n`;
        report += `==================\n`;
        reportData.weeklyStats.forEach((week, index) => {
          report += `Week ${index + 1}:\n`;
          report += `  Interviews: ${week.interviews}\n`;
          report += `  Average Score: ${week.averageScore}%\n`;
          report += `  Time Spent: ${week.timeSpent} minutes\n\n`;
        });
        break;

      case 'achievements':
        report += `ACHIEVEMENTS\n`;
        report += `=============\n`;
        reportData.achievements.forEach((achievement, index) => {
          report += `${index + 1}. ${achievement.name}\n`;
          report += `   Description: ${achievement.description}\n`;
          report += `   Earned: ${new Date(achievement.earnedDate).toLocaleDateString()}\n\n`;
        });
        break;
    }

    return report;
  };

  // Sharing features removed as requested

  // exportReport removed

  const renderReportCard = (title: string, icon: string, type: string, description: string) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => setSelectedReport(type)}
    >
      <GlassCard style={[styles.card, selectedReport === type ? styles.selectedCard : ({} as any)]}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Ionicons 
              name={icon as any} 
              size={24} 
              color={selectedReport === type ? Theme.dark.accent : Theme.dark.textSecondary} 
            />
            <Text style={[styles.cardTitle, selectedReport === type && styles.selectedText]}>
              {title}
            </Text>
          </View>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (selectedReport) {
      case 'performance':
        return (
          <GlassCard style={styles.contentCard}>
            <Text style={styles.contentTitle}>Performance Analytics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{reportData.performanceAnalytics.totalInterviews || 0}</Text>
                <Text style={styles.statLabel}>Total Interviews</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{reportData.performanceAnalytics.averageScore || 0}%</Text>
                <Text style={styles.statLabel}>Average Score</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{reportData.performanceAnalytics.bestScore || 0}%</Text>
                <Text style={styles.statLabel}>Best Score</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{reportData.performanceAnalytics.currentStreak || 0}</Text>
                <Text style={styles.statLabel}>Current Streak</Text>
              </View>
            </View>
          </GlassCard>
        );

      case 'activity':
        return (
          <GlassCard style={styles.contentCard}>
            <Text style={styles.contentTitle}>Recent Activity</Text>
            <ScrollView style={styles.activityList}>
              {reportData.activityTimeline.slice(0, 10).map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Ionicons name="checkmark-circle" size={20} color={Theme.dark.accent} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                    <Text style={styles.activityDate}>
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.activityScore}>{activity.score || 'N/A'}%</Text>
                </View>
              ))}
            </ScrollView>
          </GlassCard>
        );

      case 'domains':
        return (
          <GlassCard style={styles.contentCard}>
            <Text style={styles.contentTitle}>Domain Progress</Text>
            <ScrollView style={styles.domainList}>
              {reportData.domainProgress.map((domain, index) => (
                <View key={index} style={styles.domainItem}>
                  <View style={styles.domainInfo}>
                    <Text style={styles.domainName}>{domain.name}</Text>
                    <Text style={styles.domainScore}>{domain.score}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${domain.score}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.domainDetails}>
                    {domain.questionsAttempted} questions attempted
                  </Text>
                </View>
              ))}
            </ScrollView>
          </GlassCard>
        );

      case 'weekly':
        return (
          <GlassCard style={styles.contentCard}>
            <Text style={styles.contentTitle}>Weekly Statistics</Text>
            <ScrollView style={styles.weeklyList}>
              {reportData.weeklyStats.map((week, index) => (
                <View key={index} style={styles.weeklyItem}>
                  <Text style={styles.weekLabel}>Week {index + 1}</Text>
                  <View style={styles.weekStats}>
                    <Text style={styles.weekStat}>Interviews: {week.interviews}</Text>
                    <Text style={styles.weekStat}>Avg Score: {week.averageScore}%</Text>
                    <Text style={styles.weekStat}>Time: {week.timeSpent}min</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </GlassCard>
        );

      // achievements moved to dashboard

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports & Analytics</Text>
        <Text style={styles.headerSubtitle}>Track your interview preparation progress</Text>
      </View>

      <ScrollView style={styles.reportsContainer}>
        <View style={styles.reportTypes}>
          {renderReportCard('Performance', 'analytics', 'performance', 'Overall performance metrics and statistics')}
          {renderReportCard('Activity', 'time', 'activity', 'Recent activity timeline and history')}
          {renderReportCard('Domains', 'library', 'domains', 'Progress across different interview domains')}
          {renderReportCard('Weekly', 'calendar', 'weekly', 'Weekly statistics and trends')}
          {/* Achievements moved to Dashboard */}
        </View>

        {renderReportContent()}

        {/* actions removed */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.dark.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.dark.background,
  },
  loadingText: {
    color: Theme.dark.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Theme.dark.textPrimary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Theme.dark.textSecondary,
  },
  reportsContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  reportTypes: {
    marginBottom: 24,
  },
  reportCard: {
    marginBottom: 12,
  },
  card: {
    padding: 20,
  },
  selectedCard: {
    borderColor: Theme.dark.accent,
    borderWidth: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.dark.textPrimary,
    marginLeft: 12,
  },
  selectedText: {
    color: Theme.dark.accent,
  },
  cardDescription: {
    fontSize: 14,
    color: Theme.dark.textSecondary,
    marginLeft: 36,
    flex: 1,
  },
  contentCard: {
    padding: 24,
    marginBottom: 24,
  },
  contentTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.dark.textPrimary,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: Theme.dark.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Theme.dark.accent,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Theme.dark.textSecondary,
    textAlign: 'center',
  },
  activityList: {
    maxHeight: 400,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.dark.border,
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 16,
    color: Theme.dark.textPrimary,
    fontWeight: '600',
  },
  activityDate: {
    fontSize: 14,
    color: Theme.dark.textSecondary,
    marginTop: 2,
  },
  activityScore: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.dark.accent,
  },
  domainList: {
    maxHeight: 400,
  },
  domainItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.dark.border,
  },
  domainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  domainName: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.dark.textPrimary,
  },
  domainScore: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.dark.accent,
  },
  progressBar: {
    height: 6,
    backgroundColor: Theme.dark.surface,
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Theme.dark.accent,
    borderRadius: 3,
  },
  domainDetails: {
    fontSize: 14,
    color: Theme.dark.textSecondary,
  },
  weeklyList: {
    maxHeight: 400,
  },
  weeklyItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.dark.border,
  },
  weekLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.dark.textPrimary,
    marginBottom: 8,
  },
  weekStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekStat: {
    fontSize: 14,
    color: Theme.dark.textSecondary,
  },
  achievementsList: {
    maxHeight: 400,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.dark.border,
  },
  achievementIcon: {
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementName: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.dark.textPrimary,
  },
  achievementDescription: {
    fontSize: 14,
    color: Theme.dark.textSecondary,
    marginTop: 2,
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 12,
    color: Theme.dark.accent,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
});
