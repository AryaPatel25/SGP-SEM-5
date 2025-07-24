import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const QuizQuestionCard = React.memo(({ question, index, total, userAnswer, onAnswerChange }) => {
  if (!question) return null;

  const handleOptionSelect = (option) => {
    onAnswerChange(index, option);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.number}>Question {index + 1}</Text>
        <Text style={styles.count}>{index + 1} / {total}</Text>
      </View>
      <Text style={styles.question}>{question.question}</Text>
      <View style={styles.optionsContainer}>
        {question.options && question.options.map((option, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.option, userAnswer === option && styles.optionSelected]}
            onPress={() => handleOptionSelect(option)}
            accessibilityRole="button"
            accessibilityLabel={`Option ${i + 1}: ${option}`}
          >
            <Text style={[styles.optionText, userAnswer === option && styles.optionTextSelected]}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#23272e",
    padding: 20,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  number: {
    fontSize: 14,
    fontWeight: "600",
    color: "#38bdf8",
  },
  count: {
    fontSize: 14,
    color: "#a3a3a3",
  },
  question: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
    lineHeight: 24,
  },
  optionsContainer: {
    marginTop: 8,
  },
  option: {
    backgroundColor: "#18181b",
    borderColor: "#334155",
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  optionSelected: {
    backgroundColor: "#38bdf8",
    borderColor: "#38bdf8",
  },
  optionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  optionTextSelected: {
    color: "#18181b",
    fontWeight: "700",
  },
});

export default QuizQuestionCard; 