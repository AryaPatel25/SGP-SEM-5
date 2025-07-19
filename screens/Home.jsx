import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Home() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>AI Interview Trainer</Text>

      <View style={styles.card}>
        <Text style={styles.title}>Start a New Interview</Text>
        <Text style={styles.subtitle}>
          Choose your domain and start practicing with real-time feedback.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/interview')}>
          <Text style={styles.buttonText}>Start Interview</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Past Interviews</Text>
        <Text style={styles.subtitle}>
          Review your performance and track your progress.
        </Text>
        <TouchableOpacity style={styles.outlineButton}>
          <Text style={styles.buttonText}>View Progress</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Get Tips</Text>
        <Text style={styles.subtitle}>
          Improve your answers with voice clarity, confidence, and content quality.
        </Text>
        <TouchableOpacity style={styles.outlineButton}>
          <Text style={styles.buttonText}>View Tips</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  heading: {
    fontSize: 26,
    color: '#fff',
    marginTop: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  outlineButton: {
    borderColor: '#666',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#4f46e5'
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
