import React from "react";
import { Animated, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const QuestionCard = React.memo(({ 
  question, 
  index, 
  total, 
  userAnswer, 
  onAnswerChange, 
  showAnswer, 
  onToggleAnswer 
}) => {
  const handleAnswerChange = (text) => {
    onAnswerChange(index, text);
  };

  if (!question) return null;

  return (
    <Animated.View style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <Text style={styles.questionNumber}>Question {index + 1}</Text>
        <Text style={styles.questionCount}>{index + 1} / {total}</Text>
      </View>
      
      <Text style={styles.questionText}>{question.question}</Text>

      <TextInput
        style={styles.textInput}
        multiline
        placeholder="Write your answer here..."
        placeholderTextColor="#666"
        value={userAnswer}
        onChangeText={handleAnswerChange}
        textAlignVertical="top"
        accessibilityLabel={`Answer input for question ${index + 1}`}
      />

      <TouchableOpacity
        style={styles.showAnswerButton}
        onPress={onToggleAnswer}
        accessibilityRole="button"
        accessibilityLabel={showAnswer ? "Hide answer" : "Show answer"}
      >
        <Text style={styles.showAnswerButtonText}>
          {showAnswer ? "Hide Answer" : "Show Answer"}
        </Text>
      </TouchableOpacity>

      {showAnswer && (
        <Animated.View style={styles.answerContainer}>
          <Text style={styles.answerLabel}>Model Answer:</Text>
          <Text style={styles.answerText}>{question.answer}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  questionCard: {
    backgroundColor: "#23272e",
    padding: 20,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#38bdf8",
  },
  questionCount: {
    fontSize: 14,
    color: "#a3a3a3",
  },
  questionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
    lineHeight: 24,
  },
  textInput: {
    backgroundColor: "#18181b",
    color: "#fff",
    padding: 16,
    borderRadius: 12,
    minHeight: 120,
    textAlignVertical: "top",
    fontSize: 16,
    lineHeight: 22,
    borderWidth: 1.5,
    borderColor: "#334155",
  },
  showAnswerButton: {
    backgroundColor: "#38bdf8",
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#38bdf8",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  showAnswerButtonText: {
    color: "#18181b",
    fontWeight: "700",
    fontSize: 16,
  },
  answerContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#18181b",
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#38bdf8",
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#38bdf8",
    marginBottom: 8,
  },
  answerText: {
    color: "#a3a3a3",
    fontSize: 15,
    lineHeight: 22,
  },
});

export default QuestionCard; 