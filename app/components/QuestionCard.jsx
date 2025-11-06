import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useState } from "react";
import {
    Alert,
    Animated,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { buildBackendUrl } from '../../src/utils/backendUrl';

const QuestionCard = React.memo(({ 
  question, 
  index, 
  total, 
  userAnswer, 
  onAnswerChange, 
  showHint, 
  onToggleHint 
}) => {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const startRecording = async () => {
    try {
      if (!hasPermission) {
        Alert.alert('Permission needed', 'Please grant microphone permission to record audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      setIsConverting(true);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      // Send audio to backend for speech-to-text conversion
      const formData = new FormData();
      formData.append('audio', {
        uri: uri,
        type: 'audio/m4a',
        name: 'recording.m4a'
      });

      const response = await fetch(buildBackendUrl('/speech-to-text'), {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      
      if (data.text) {
        // Append the transcribed text to the existing answer
        const currentText = userAnswer || '';
        const newText = currentText + (currentText ? ' ' : '') + data.text;
        onAnswerChange(index, newText);
      } else {
        Alert.alert('Error', 'Could not convert speech to text. Please try again.');
      }
    } catch (err) {
      console.error('Failed to stop recording or convert speech', err);
      Alert.alert('Error', 'Failed to process recording. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleAnswerChange = (text) => {
    onAnswerChange(index, text);
  };

  const handleMicPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (!question) return null;

  return (
    <Animated.View style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <Text style={styles.questionNumber}>Question {index + 1}</Text>
        <Text style={styles.questionCount}>{index + 1} / {total}</Text>
      </View>
      
      <Text style={styles.questionText}>{question.question}</Text>

      <View style={styles.inputContainer}>
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
          style={[styles.micButton, isRecording && styles.micButtonRecording, isConverting && styles.micButtonDisabled]}
          onPress={handleMicPress}
          disabled={isConverting}
          accessibilityRole="button"
          accessibilityLabel={isConverting ? "Converting speech" : isRecording ? "Stop recording" : "Start recording"}
        >
          <Ionicons 
            name={isConverting ? "hourglass" : isRecording ? "stop" : "mic"} 
            size={24} 
            color={isConverting ? "#666" : isRecording ? "#fff" : "#38bdf8"} 
          />
        </TouchableOpacity>
      </View>

      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>Recording...</Text>
        </View>
      )}

      {isConverting && (
        <View style={styles.convertingIndicator}>
          <View style={styles.convertingDot} />
          <Text style={styles.convertingText}>Converting speech to text...</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.showAnswerButton}
        onPress={onToggleHint}
        accessibilityRole="button"
        accessibilityLabel={showHint ? "Hide hint" : "Show hint"}
      >
        <Text style={styles.showAnswerButtonText}>
          {showHint ? "Hide Hint" : "Show Hint"}
        </Text>
      </TouchableOpacity>

      {showHint && (
        <Animated.View style={styles.answerContainer}>
          <Text style={styles.answerLabel}>Hint:</Text>
          <Text style={styles.answerText}>{question.hint || "Think about the key concepts and provide a structured response."}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  questionCard: {
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
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  questionNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: "#38bdf8",
  },
  questionCount: {
    fontSize: 14,
    color: "#a3a3a3",
  },
  questionText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: 18,
    lineHeight: 26,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: "#18181b",
    color: "#fff",
    padding: 18,
    borderRadius: 14,
    minHeight: 120,
    textAlignVertical: "top",
    fontSize: 17,
    lineHeight: 24,
    borderWidth: 1.5,
    borderColor: "#334155",
    flex: 1,
    marginRight: 12,
  },
  micButton: {
    backgroundColor: "#18181b",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: "#38bdf8",
  },
  micButtonRecording: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  micButtonDisabled: {
    opacity: 0.7,
    backgroundColor: "#666",
    borderColor: "#666",
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  recordingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  convertingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#38bdf8',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  convertingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  convertingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  showAnswerButton: {
    backgroundColor: "#38bdf8",
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#38bdf8",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  showAnswerButtonText: {
    color: "#18181b",
    fontWeight: "800",
    fontSize: 17,
  },
  answerContainer: {
    marginTop: 18,
    padding: 18,
    backgroundColor: "#18181b",
    borderRadius: 12,
    borderLeftWidth: 5,
    borderLeftColor: "#38bdf8",
  },
  answerLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#38bdf8",
    marginBottom: 10,
  },
  answerText: {
    color: "#a3a3a3",
    fontSize: 16,
    lineHeight: 24,
  },
});

QuestionCard.displayName = 'QuestionCard';

export default QuestionCard; 