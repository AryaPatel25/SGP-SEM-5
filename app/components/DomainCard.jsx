import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const DomainCard = React.memo(({ domain, onPress, style }) => {
  const handlePress = () => {
    onPress();
  };

  return (
    <TouchableOpacity style={[styles.domainCard, style]} onPress={handlePress}>
      <Text style={styles.domainTitle}>{domain.name}</Text>
      <Text style={styles.domainDescription} numberOfLines={2}>
        {domain.description || "No description available"}
      </Text>
      <View style={styles.domainMeta}>
        <Text style={styles.domainQuestionCount}>
          {domain.questionCount || 0} questions
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  domainCard: {
    flex: 1,
    minWidth: 150,
    margin: 10,
    backgroundColor: "#23272e",
    padding: 24,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
    minHeight: 140,
    alignItems: "flex-start",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#334155",
  },
  domainTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f1f5f9",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  domainDescription: {
    fontSize: 14,
    color: "#a3a3a3",
    lineHeight: 20,
    marginBottom: 10,
  },
  domainMeta: {
    marginTop: 6,
  },
  domainQuestionCount: {
    fontSize: 13,
    color: "#38bdf8",
    fontWeight: "600",
  },
});

DomainCard.displayName = 'DomainCard';

export default DomainCard; 