import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const NavigationButtons = React.memo(({ 
  currentIndex, 
  total, 
  onPrev, 
  onNext, 
  onBack,
  onSubmit 
}) => {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;

  return (
    <View style={styles.navigationContainer}>
      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={[styles.navButton, isFirst && styles.disabledButton]}
          onPress={onPrev}
          disabled={isFirst}
          accessibilityRole="button"
          accessibilityLabel="Previous question"
        >
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>

        {isLast ? (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={onSubmit}
            accessibilityRole="button"
            accessibilityLabel="Submit interview practice"
          >
            <Text style={styles.submitButtonText}>Submit Practice</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.navButton}
            onPress={onNext}
            accessibilityRole="button"
            accessibilityLabel="Next question"
          >
            <Text style={styles.navButtonText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back to domains"
      >
        <Text style={styles.backButtonText}>Back to Domains</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  navigationContainer: {
    marginTop: 20,
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  navButton: {
    backgroundColor: "#38bdf8",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    shadowColor: "#38bdf8",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: "#333",
    opacity: 0.6,
  },
  navButtonText: {
    color: "#18181b",
    fontWeight: "700",
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#0ea5e9",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    shadowColor: "#0ea5e9",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  backButton: {
    backgroundColor: "#23272e",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonText: {
    color: "#38bdf8",
    fontWeight: "700",
    fontSize: 16,
  },
});

export default NavigationButtons; 