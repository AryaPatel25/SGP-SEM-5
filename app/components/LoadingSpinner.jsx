import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const LoadingSpinner = ({ message = "Loading..." }) => (
  <View style={styles.centered}>
    <ActivityIndicator size="large" color="#4CAF50" />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#18181b',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
});

export default LoadingSpinner; 