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
    padding: 24,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: "#334155",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  number: {
    fontSize: 15,
    fontWeight: "700",
    color: "#38bdf8",
  },
  count: {
    fontSize: 15,
    color: "#a3a3a3",
  },
  question: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: 18,
    lineHeight: 26,
  },
  optionsContainer: {
    marginTop: 10,
  },
  option: {
    backgroundColor: "#18181b",
    borderColor: "#334155",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
    transition: 'all 0.2s',
  },
  optionSelected: {
    backgroundColor: "#38bdf8",
    borderColor: "#38bdf8",
  },
  optionText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  optionTextSelected: {
    color: "#18181b",
    fontWeight: "800",
  },
});

export default QuizQuestionCard; 