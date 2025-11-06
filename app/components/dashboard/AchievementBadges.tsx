import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

interface AchievementBadgesProps {
  achievements: Achievement[];
}

const AchievementBadges: React.FC<AchievementBadgesProps> = ({ achievements }) => {
  const renderAchievement = ({ item }: { item: Achievement }) => (
    <TouchableOpacity
      style={[
        styles.achievementCard,
        !item.unlocked && styles.achievementLocked,
      ]}
      disabled={!item.unlocked}
    >
      <View style={styles.achievementIcon}>
        {item.unlocked && item.icon && item.icon.startsWith('image:') ? (
          <Image
            source={{ uri: item.icon.replace('image:', '') }}
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
        ) : (
          <Text style={[
            styles.iconText,
            !item.unlocked && styles.iconTextLocked,
          ]}>
            {item.unlocked ? (item.icon || '🏆') : '🔒'}
          </Text>
        )}
      </View>
      <Text style={[
        styles.achievementTitle,
        !item.unlocked && styles.textLocked,
      ]}>
        {item.title}
      </Text>
      <Text style={[
        styles.achievementDescription,
        !item.unlocked && styles.textLocked,
      ]}>
        {item.description}
      </Text>
      {item.unlocked && item.unlockedAt && (
        <Text style={styles.unlockedDate}>
          {item.unlockedAt.toLocaleDateString()}
        </Text>
      )}
      {!item.unlocked && (
        <View style={styles.lockOverlay}>
          <Text style={styles.lockText}>Locked</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.progressText}>
          {unlockedCount} of {totalCount} achievements unlocked
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(unlockedCount / totalCount) * 100}%` },
            ]}
          />
        </View>
      </View>
      <FlatList
        data={achievements}
        renderItem={renderAchievement}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.achievementRow}
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
  header: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 2,
  },
  achievementRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  achievementCard: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '48%',
    position: 'relative',
    minHeight: 100,
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 20,
  },
  iconTextLocked: {
    fontSize: 16,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 14,
  },
  textLocked: {
    color: '#64748b',
  },
  unlockedDate: {
    fontSize: 8,
    color: '#22c55e',
    marginTop: 4,
    fontWeight: '500',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  lockText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default AchievementBadges; 