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
    margin: 8,
    backgroundColor: "#23272e",
    padding: 20,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 130,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  domainTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
  },
  domainDescription: {
    fontSize: 13,
    color: "#a3a3a3",
    lineHeight: 18,
    marginBottom: 8,
  },
  domainMeta: {
    marginTop: 4,
  },
  domainQuestionCount: {
    fontSize: 12,
    color: "#38bdf8",
    fontWeight: "500",
  },
});

export default DomainCard; 