import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

interface Activity {
  id: string;
  type: 'interview_completed' | 'achievement_unlocked';
  domain?: string;
  score?: number;
  title?: string;
  description?: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - timestamp.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'interview_completed':
        return '🎯';
      case 'achievement_unlocked':
        return '🏆';
      default:
        return '📝';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'interview_completed':
        return '#38bdf8';
      case 'achievement_unlocked':
        return '#f59e0b';
      default:
        return '#94a3b8';
    }
  };

  const renderActivity = ({ item }: { item: Activity }) => (
    <View style={styles.activityItem}>
      <View style={styles.activityIcon}>
        <Text style={styles.iconText}>{getActivityIcon(item.type)}</Text>
      </View>
      <View style={styles.activityContent}>
        {item.type === 'interview_completed' ? (
          <>
            <Text style={styles.activityTitle}>
              Completed {item.domain} Interview
            </Text>
            <Text style={styles.activitySubtitle}>
              Score: {item.score}%
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.activityTitle}>{item.title}</Text>
            <Text style={styles.activitySubtitle}>{item.description}</Text>
          </>
        )}
        <Text style={styles.activityTime}>{formatTimeAgo(item.timestamp)}</Text>
      </View>
      <View
        style={[
          styles.activityIndicator,
          { backgroundColor: getActivityColor(item.type) },
        ]}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#23272e',
    padding: 16,
    borderRadius: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    position: 'relative',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 10,
    color: '#64748b',
  },
  activityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    right: 0,
    top: 16,
  },
});

export default ActivityFeed; 