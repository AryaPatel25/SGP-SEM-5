import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const ProgressChart: React.FC = () => {
  // Mock data for domain performance
  const domainData = [
    { name: 'Frontend', score: 85, color: '#38bdf8' },
    { name: 'Backend', score: 92, color: '#22c55e' },
    { name: 'Data Science', score: 78, color: '#f59e0b' },
    { name: 'DevOps', score: 65, color: '#ef4444' },
    { name: 'Mobile', score: 88, color: '#8b5cf6' },
    { name: 'AI/ML', score: 71, color: '#ec4899' },
  ];

  const renderCircularProgress = (score: number, color: string, size: number = 60) => {
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;
    const remaining = circumference - progress;

    return (
      <View style={[styles.circleContainer, { width: size, height: size }]}>
        <View
          style={[
            styles.circleBackground,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
            },
          ]}
        />
        <View
          style={[
            styles.circleProgress,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              borderTopColor: 'transparent',
              borderRightColor: 'transparent',
              transform: [{ rotate: '-90deg' }],
            },
          ]}
        />
        <View style={styles.circleText}>
          <Text style={styles.scoreText}>{score}%</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.chartGrid}>
        {domainData.map((domain, index) => (
          <View key={index} style={styles.domainItem}>
            {renderCircularProgress(domain.score, domain.color)}
            <Text style={styles.domainName}>{domain.name}</Text>
          </View>
        ))}
      </View>
      <View style={styles.performanceSummary}>
        <Text style={styles.summaryTitle}>Performance Summary</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Best Domain</Text>
            <Text style={styles.summaryValue}>Backend (92%)</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Needs Improvement</Text>
            <Text style={styles.summaryValue}>DevOps (65%)</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#23272e',
    padding: 16,
    borderRadius: 12,
  },
  chartGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  domainItem: {
    alignItems: 'center',
    width: '30%',
    marginBottom: 16,
  },
  circleContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  circleBackground: {
    position: 'absolute',
    borderColor: '#334155',
  },
  circleProgress: {
    position: 'absolute',
  },
  circleText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  domainName: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500',
  },
  performanceSummary: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default ProgressChart; 