import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import GlassCard from "../../components/ui/GlassCard";
import { Theme } from "../../constants/Colors";

const DomainCard = React.memo(({ domain, onPress, style }) => {
  const handlePress = () => {
    onPress();
  };

  return (
    <TouchableOpacity style={style} onPress={handlePress} activeOpacity={0.8}>
      <GlassCard style={styles.domainCard}>
        <Text 
          style={styles.domainTitle}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {domain.name}
        </Text>
        <Text style={styles.domainDescription} numberOfLines={2}>
          {domain.description || "No description available"}
        </Text>
        <View style={styles.domainMeta}>
          <Text style={styles.domainQuestionCount}>
            {domain.questionCount || 0} questions
          </Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  domainCard: {
    padding: 20,
    minHeight: 160,
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  domainTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.dark.textPrimary,
    marginBottom: 10,
    letterSpacing: 0.3,
    lineHeight: 24,
  },
  domainDescription: {
    fontSize: 14,
    color: Theme.dark.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
    flex: 1,
  },
  domainMeta: {
    marginTop: 4,
  },
  domainQuestionCount: {
    fontSize: 13,
    color: Theme.dark.accent,
    fontWeight: "700",
  },
});

DomainCard.displayName = 'DomainCard';

export default DomainCard; 