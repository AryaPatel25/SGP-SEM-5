import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Video } from 'expo-av';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import GradientButton from '../../components/ui/GradientButton';
import { Theme } from '../../constants/Colors';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../src/context/AuthContext';
import { buildBackendUrl } from '../../src/utils/backendUrl';

// Normalize evaluation payloads that may contain JSON or code-fenced JSON as strings
function extractScoreAndFeedback(input: any): { score: number | null; feedback: string | null } {
  let score: number | null = null;
  let feedback: string | null = null;
  if (!input) return { score, feedback };
  const maybeScore = (input as any)?.score;
  const maybeFeedback = (input as any)?.feedback;
  if (typeof maybeScore === 'number') score = maybeScore;
  if (typeof maybeFeedback === 'string') feedback = maybeFeedback;
  // If feedback itself is JSON or code-fenced, clean and parse
  if (typeof feedback === 'string') {
    let text = feedback.trim();
    // strip triple backtick or triple quote fences
    text = text.replace(/^```[a-zA-Z]*\n?/m, '').replace(/```\s*$/m, '');
    text = text.replace(/^'''[a-zA-Z]*\n?/m, '').replace(/'''\s*$/m, '');
    // If looks like JSON object, attempt parse
    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        const obj = JSON.parse(text);
        if (typeof obj?.score === 'number') score = obj.score;
        if (typeof obj?.feedback === 'string') feedback = obj.feedback;
      } catch {}
    } else {
      // Try to extract JSON substring from within text
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const obj = JSON.parse(match[0]);
          if (typeof obj?.score === 'number') score = obj.score;
          if (typeof obj?.feedback === 'string') feedback = obj.feedback;
        } catch {}
      } else {
        feedback = text;
      }
    }
  }
  return { score, feedback };
}

function toSecondPersonPolite(text: string | null): string | null {
  if (!text) return text;
  let cleaned = text.replace(/\s*>+\s*$/, ''); // drop stray angle brackets
  // Convert third-person mentions to second person where obvious
  cleaned = cleaned.replace(/\b[Tt]he user\b/g, 'you');
  cleaned = cleaned.replace(/\buser's\b/gi, 'your');
  cleaned = cleaned.replace(/\btheir\b/g, 'your');
  cleaned = cleaned.replace(/\bthey\b/g, 'you');
  cleaned = cleaned.replace(/\bthem\b/g, 'you');
  // Trim excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

export default function MockInterviewScreen() {
  const { user } = useAuth();
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recording, setRecording] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [countdown, setCountdown] = useState(90); // seconds per question
  const [transcript, setTranscript] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [results, setResults] = useState<Array<{ question: string; transcript: string; score: number | null; feedback: string | null; file?: string }>>([]);
  const [questions, setQuestions] = useState<string[]>([
    'Tell me about yourself.',
    'What are your strengths and weaknesses?',
    'Why do you want this job?',
  ]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [preCountdown, setPreCountdown] = useState(0); // 3..2..1 before recording
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const preCountdownRef = useRef<NodeJS.Timeout | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const resetSession = () => {
    try { cameraRef.current?.stopRecording?.(); } catch {}
    setRecording(false);
    setQuestionIndex(0);
    setVideoUri(null);
    setIsAnalyzing(false);
    setCountdown(90);
    setTranscript(null);
    setScore(null);
    setFeedback(null);
    setResults([]);
    setPreCountdown(0);
  };

  useEffect(() => {
    (async () => {
      try {
        const cam = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
        const mic = micPermission?.granted ? micPermission : await requestMicPermission();
        setHasPermission(Boolean(cam?.granted && mic?.granted));
      } catch {
        setHasPermission(false);
      }
    })();
  }, [cameraPermission?.granted, micPermission?.granted]);

  // Start a fresh session whenever this screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      resetSession();
      // optionally refetch questions on each focus
      (async () => {
        try {
          setLoadingQuestions(true);
          const resp = await fetch(buildBackendUrl('/generate-question'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: '', questionType: 'descriptive', domain: { name: 'HR' }, count: 5 }),
          });
          const data = await resp.json();
          const list = Array.isArray(data?.questions) ? data.questions.map((q: any) => String(q?.question || '')).filter(Boolean) : [];
          if (list.length) setQuestions(list);
        } catch {}
        finally { setLoadingQuestions(false); }
      })();
      return () => {};
    }, [])
  );

  // Fetch HR-related descriptive questions from backend on mount
  useEffect(() => {
    (async () => {
      try {
        setLoadingQuestions(true);
        const resp = await fetch(buildBackendUrl('/generate-question'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: '',
            questionType: 'descriptive',
            domain: { name: 'HR' },
            count: 5,
          }),
        });
        const data = await resp.json();
        const list = Array.isArray(data?.questions)
          ? data.questions.map((q: any) => String(q?.question || '')).filter(Boolean)
          : [];
        if (list.length) setQuestions(list);
      } catch {}
      finally {
        setLoadingQuestions(false);
      }
    })();
  }, []);

  const startRecording = async () => {
    try {
      if (!cameraRef.current) return;
      if (!isCameraReady) {
        Alert.alert('Camera not ready', 'Please wait a moment and try again.');
        return;
      }
      setRecording(true);
      setTranscript(null);
      setScore(null);
      setFeedback(null);
      setCountdown(90);
      // run countdown tick while recording
      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            try { cameraRef.current?.stopRecording(); } catch {}
            return 0;
          }
          return prev - 1;
        });
      }, 1000) as unknown as NodeJS.Timeout;

      const cam: any = cameraRef.current as any;
      if (typeof cam.startRecording === 'function') {
        cam.startRecording({
          maxDuration: 120,
          mute: false,
          onRecordingFinished: (video: { uri?: string }) => {
            if (countdownRef.current) clearInterval(countdownRef.current);
            setVideoUri(video?.uri || null);
            setRecording(false);
          },
          onRecordingError: (err: any) => {
            console.warn('startRecording error', err);
            if (countdownRef.current) clearInterval(countdownRef.current);
            setRecording(false);
            Alert.alert('Recording Error', 'Failed to record video');
          },
        });
      } else if (typeof cam.recordAsync === 'function') {
        // Fallback for environments exposing legacy API
        cam.recordAsync({ maxDuration: 120 })
          .then((video: { uri?: string }) => {
            if (countdownRef.current) clearInterval(countdownRef.current);
            setVideoUri(video?.uri || null);
            setRecording(false);
          })
          .catch((err: any) => {
            console.warn('recordAsync error', err);
            if (countdownRef.current) clearInterval(countdownRef.current);
            setRecording(false);
            Alert.alert('Recording Error', 'Failed to record video');
          });
      } else {
        if (countdownRef.current) clearInterval(countdownRef.current);
        setRecording(false);
        Alert.alert('Recording Error', 'Recording API not available in this runtime.');
      }
    } catch (e) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setRecording(false);
      console.warn('Recording exception', e);
      Alert.alert('Recording Error', 'Failed to record video');
    }
  };

  const askAndStart = async () => {
    if (recording) return;
    // Clear any previous pre-countdown timers
    if (preCountdownRef.current) clearInterval(preCountdownRef.current);
    // Prepare for a fresh recording
    try { cameraRef.current?.stopRecording?.(); } catch {}
    setTranscript(null);
    setScore(null);
    setFeedback(null);
    if (videoUri) setVideoUri(null);
    // Start pre-roll countdown
    setPreCountdown(3);
    preCountdownRef.current = setInterval(() => {
      setPreCountdown((val) => {
        if (val <= 1) {
          if (preCountdownRef.current) clearInterval(preCountdownRef.current);
          // small safety delay to ensure camera is idle before starting
          setTimeout(() => {
            startRecording();
          }, 100);
          return 0;
        }
        return val - 1;
      });
    }, 1000) as unknown as NodeJS.Timeout;
  };

  const stopRecording = async () => {
    try {
      cameraRef.current?.stopRecording();
    } catch {}
  };

  const uploadRecording = async () => {
    if (!videoUri) return;
    try {
      const url = buildBackendUrl('/upload-interview');
      const form = new FormData();
      const file: any = { uri: videoUri, name: 'response.mp4', type: 'video/mp4' };
      form.append('video', file);
      const resp = await fetch(url, { method: 'POST', body: form });
      const data = await resp.json();
      if (!data.success) throw new Error('Upload failed');
      // keep returned file path if available
      setResults((prev) => {
        const existing = prev[questionIndex];
        const updated = {
          question: questions[questionIndex],
          transcript: existing?.transcript || '',
          score: existing?.score ?? null,
          feedback: existing?.feedback ?? null,
          file: data.file,
        };
        const copy = [...prev];
        copy[questionIndex] = updated;
        return copy;
      });
      Alert.alert('Uploaded', 'Your response was uploaded successfully.');
    } catch (e) {
      Alert.alert('Upload Error', 'Failed to upload video');
    }
  };

  const analyzeResponse = async () => {
    if (!videoUri) return;
    setIsAnalyzing(true);
    try {
      // 1) Speech-to-text
      const sttUrl = buildBackendUrl('/speech-to-text');
      const sttForm = new FormData();
      const file: any = { uri: videoUri, name: 'response.mp4', type: 'video/mp4' };
      sttForm.append('audio', file);
      const sttResp = await fetch(sttUrl, { method: 'POST', body: sttForm });
      const sttData = await sttResp.json();
      const userText: string = sttData?.text || '';
      setTranscript(userText);

      // 2) Generate model answer for this question
      const q = questions[questionIndex];
      const gaResp = await fetch(buildBackendUrl('/generate-sample-answer'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const gaData = await gaResp.json();
      const modelAnswer: string = gaData?.answer || '';

      // 3) Evaluate
      const evalResp = await fetch(buildBackendUrl('/evaluate-answer'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAnswer: userText, modelAnswer }),
      });
      const evalData = await evalResp.json();
      const { score: parsedScore, feedback: parsedFeedback } = extractScoreAndFeedback(evalData);
      const finalScore: number | null = typeof parsedScore === 'number' ? parsedScore : (typeof evalData?.score === 'number' ? evalData.score : null);
      const finalFeedback: string | null = toSecondPersonPolite(parsedFeedback ?? (typeof evalData?.feedback === 'string' ? evalData.feedback : null));
      setScore(finalScore);
      setFeedback(finalFeedback);

      setResults((prev) => {
        const existing = prev[questionIndex];
        const updated = {
          question: q,
          transcript: userText,
          score: typeof evalData?.score === 'number' ? evalData.score : null,
          feedback: evalData?.feedback || null,
          file: existing?.file,
        };
        const copy = [...prev];
        copy[questionIndex] = updated;
        return copy;
      });
    } catch (e) {
      Alert.alert('Analyze Error', 'Failed to analyze your response');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const nextQuestion = () => {
    setVideoUri(null);
    setTranscript(null);
    setScore(null);
    setFeedback(null);
    setQuestionIndex((i) => Math.min(i + 1, questions.length - 1));
  };

  const isLast = useMemo(() => questionIndex >= questions.length - 1, [questionIndex, questions.length]);
  const avgScore = useMemo(() => {
    const valid = results.map(r => r?.score).filter((s): s is number => typeof s === 'number');
    if (!valid.length) return null;
    return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
  }, [results]);

  const saveSession = async () => {
    try {
      if (!user) {
        Alert.alert('Not signed in', 'Please login to save your session.');
        return;
      }
      const payload = {
        questions,
        results,
        averageScore: avgScore,
        totalQuestions: questions.length,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'users', user.id, 'mockInterviews'), payload);
      Alert.alert('Session Saved', `Overall score: ${avgScore ?? 'N/A'}/10`, [
        { text: 'OK' }
      ]);
    } catch (e) {
      Alert.alert('Save Error', 'Failed to save session.');
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.center}> 
        <Text style={styles.text}>Requesting permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera/Microphone permission denied.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.header}>Mock Interview</Text>
      <Text style={styles.question}>{loadingQuestions ? 'Preparing HR question…' : questions[questionIndex]}</Text>
      {preCountdown > 0 && (
        <Text style={styles.timer}>Starting in: {preCountdown}s</Text>
      )}
      {recording && (
        <Text style={styles.timer}>Time left: {countdown}s</Text>
      )}
      <View style={styles.preview}>
        {videoUri ? (
          <Video
            source={{ uri: videoUri }}
            style={{ flex: 1 }}
            useNativeControls
            resizeMode={'cover' as any}
            isLooping
          />
        ) : (
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing={'front' as any}
            mode={'video' as any}
            videoQuality={'480p' as any}
            {...({ captureAudio: true } as any)}
            onMountError={(e: any) => {
              console.warn('Camera mount error', e);
              Alert.alert('Camera Error', 'Unable to start camera.');
            }}
            onError={(e: any) => {
              console.warn('Camera runtime error', e);
            }}
            onCameraReady={() => setIsCameraReady(true)}
          />
        )}
      </View>

      <View style={styles.actions}>
        {!recording ? (
          <GradientButton
            label={videoUri ? 'Ask Again & Re-record' : 'Start'}
            onPress={askAndStart}
            colors={[Theme.dark.accent, Theme.dark.accent]}
            leftIcon={<Ionicons name="radio-button-on" size={20} color="#fff" />}
          />
        ) : (
          <GradientButton
            label="Stop"
            onPress={stopRecording}
            colors={[Theme.dark.danger, Theme.dark.danger]}
            leftIcon={<Ionicons name="stop" size={20} color="#fff" />}
          />
        )}

        <GradientButton
          label="Upload Response"
          onPress={uploadRecording}
          colors={[Theme.dark.gradient.primary[0], Theme.dark.gradient.primary[1]]}
          leftIcon={<Ionicons name="cloud-upload" size={20} color="#fff" />}
        />

        <GradientButton
          label={isAnalyzing ? 'Analyzing...' : 'Analyze & Score'}
          onPress={analyzeResponse}
          colors={[Theme.dark.gradient.primary[0], Theme.dark.gradient.primary[1]]}
          leftIcon={isAnalyzing ? <ActivityIndicator color="#fff" /> : <Ionicons name="analytics" size={20} color="#fff" />}
        />

        <GradientButton
          label={!isLast ? 'Next Question' : 'Finish'}
          onPress={!isLast ? nextQuestion : saveSession}
          colors={[Theme.dark.gradient.secondary[0], Theme.dark.gradient.secondary[1]]}
          leftIcon={<Ionicons name="arrow-forward" size={20} color="#fff" />}
        />
      </View>

      {(transcript || typeof score === 'number' || feedback) && (
        <View style={styles.resultCard}>
          {transcript ? (
            <Text style={styles.resultText}><Text style={styles.resultLabel}>Transcript: </Text>{transcript}</Text>
          ) : null}
          {typeof score === 'number' ? (
            <Text style={styles.resultText}><Text style={styles.resultLabel}>Score: </Text>{score}/10</Text>
          ) : null}
          {feedback ? (
            <Text style={styles.resultText}><Text style={styles.resultLabel}>Feedback: </Text>{feedback}</Text>
          ) : null}
        </View>
      )}

      {isLast && avgScore !== null && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryHeader}>Session Summary</Text>
          <Text style={styles.summaryText}>Average score: {avgScore}/10</Text>
          {results.map((r, idx) => (
            <View key={idx} style={styles.summaryItem}>
              <Text style={styles.summaryQ}>{idx + 1}. {r?.question || questions[idx]}</Text>
              {typeof r?.score === 'number' && (
                <Text style={styles.summaryScore}>Score: {r.score}/10</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.dark.background,
    padding: 16,
  },
  content: {
    paddingBottom: 24,
    gap: 8,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.dark.background,
  },
  text: { color: Theme.dark.textPrimary },
  header: {
    color: Theme.dark.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  question: {
    color: Theme.dark.textSecondary,
    fontSize: 16,
    marginBottom: 12,
  },
  timer: {
    color: Theme.dark.accent,
    fontSize: 14,
    marginBottom: 8,
  },
  preview: {
    backgroundColor: '#000',
    height: 320,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  actions: {
    gap: 10,
  },
  resultCard: {
    backgroundColor: '#111214',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  resultLabel: { color: Theme.dark.textSecondary, fontWeight: '700' },
  resultText: { color: Theme.dark.textPrimary, marginBottom: 6 },
  summaryCard: {
    backgroundColor: '#0e0f11',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  summaryHeader: { color: Theme.dark.textPrimary, fontWeight: '800', marginBottom: 6 },
  summaryText: { color: Theme.dark.textSecondary, marginBottom: 8 },
  summaryItem: { marginBottom: 6 },
  summaryQ: { color: Theme.dark.textPrimary },
  summaryScore: { color: Theme.dark.accent },
});


