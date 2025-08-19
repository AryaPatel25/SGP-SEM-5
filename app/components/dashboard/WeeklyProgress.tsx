import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface WeeklyData {
  day: string;
  interviews: number;
  score: number;
}

interface WeeklyProgressProps {
  data: WeeklyData[];
}

const WeeklyProgress: React.FC<WeeklyProgressProps> = ({ data }) => {
  const maxInterviews = Math.max(...data.map(d => d.interviews));
  const maxScore = Math.max(...data.map(d => d.score));

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.barContainer}>
            <View style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height: maxInterviews > 0 ? (item.interviews / maxInterviews) * 80 : 0,
                    backgroundColor: '#38bdf8',
                  },
                ]}
              />
            </View>
            <Text style={styles.dayText}>{item.day}</Text>
            <Text style={styles.scoreText}>{item.score}%</Text>
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#38bdf8' }]} />
          <Text style={styles.legendText}>Interviews</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.legendText}>Score %</Text>
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
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 16,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: 80,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 20,
    borderRadius: 10,
    minHeight: 4,
  },
  dayText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  scoreText: {
    fontSize: 10,
    color: '#22c55e',
    fontWeight: '600',
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#94a3b8',
  },
});

export default WeeklyProgress; 