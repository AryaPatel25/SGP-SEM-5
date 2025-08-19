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
    marginTop: 24,
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 14,
  },
  navButton: {
    backgroundColor: "#38bdf8",
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignItems: "center",
    flex: 1,
    shadowColor: "#38bdf8",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
    marginHorizontal: 4,
  },
  disabledButton: {
    backgroundColor: "#333",
    opacity: 0.6,
  },
  navButtonText: {
    color: "#18181b",
    fontWeight: "800",
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#0ea5e9",
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignItems: "center",
    flex: 1,
    shadowColor: "#0ea5e9",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
    marginHorizontal: 4,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 17,
  },
  backButton: {
    backgroundColor: "#23272e",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 8,
  },
  backButtonText: {
    color: "#38bdf8",
    fontWeight: "800",
    fontSize: 16,
  },
});

export default NavigationButtons; 