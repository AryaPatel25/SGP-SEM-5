import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Theme } from '../../constants/Colors';
import { useAuth } from '../../src/context/AuthContext';
import { buildBackendUrl } from '../../src/utils/backendUrl';
import { parseExcelQuizFile, QuizQuestion, validateQuizQuestions } from '../../src/utils/excelParser';
import ExcelUploader from '../components/ExcelUploader';
import LoadingSpinner from '../components/LoadingSpinner';
import NavigationButtons from '../components/NavigationButtons';
import QuizQuestionCard from '../components/QuizQuestionCard';

export default function CustomQuizScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<'upload' | 'quiz' | 'results'>('upload');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [quizTitle, setQuizTitle] = useState('Custom Quiz');

  const handleFileSelected = async (fileUri: string, fileName: string) => {
    setIsLoading(true);
    try {
      // Try backend parsing first
      const formData = new FormData();
      // @ts-ignore React Native file
      formData.append('file', { uri: fileUri, name: fileName, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const endpoint = buildBackendUrl('/parse-excel');
      let parsedQuestions: QuizQuestion[] | null = null;
      try {
        const resp = await fetch(endpoint, { method: 'POST', body: formData });
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.success && Array.isArray(data.questions)) {
            parsedQuestions = data.questions as QuizQuestion[];
          } else if (Array.isArray(data?.errors) && data.errors.length) {
            throw new Error(data.errors.join('\n'));
          }
        } else {
          throw new Error(`Server error: ${resp.status}`);
        }
      } catch (e) {
        // Fallback to local parsing if backend fails
        const result = await parseExcelQuizFile(fileUri);
        if (!result.success) throw new Error(result.errors.join('\n'));
        parsedQuestions = result.questions;
      }

      const validation = validateQuizQuestions(parsedQuestions || []);
      if (!validation.isValid) throw new Error(validation.errors.join('\n'));

      setQuestions(parsedQuestions || []);
      setQuizTitle(fileName.replace(/\.[^/.]+$/, "")); // Remove file extension
      setCurrentStep('quiz');
    } catch (error) {
      Alert.alert('Error', 'Failed to process the Excel file. Please check the format and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleParseComplete = (parsedQuestions: QuizQuestion[], errors: string[]) => {
    if (errors.length > 0) {
      Alert.alert('Parse Errors', errors.join('\n'));
      return;
    }

    const validation = validateQuizQuestions(parsedQuestions);
    if (!validation.isValid) {
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }

    setQuestions(parsedQuestions);
    setCurrentStep('quiz');
  };

  const handleAnswerSelect = (index: number, value: number) => {
    setUserAnswers(prev => ({ ...prev, [index]: value }));
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1));
  };

  const handleSubmit = () => {
    setCurrentStep('results');
  };

  const handleBackToUpload = () => {
    setCurrentStep('upload');
    setQuestions([]);
    setCurrentIndex(0);
    setUserAnswers({});
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (userAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
  };

  const renderUploadStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Theme.dark.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Custom Quiz</Text>
        <View style={styles.placeholder} />
      </View>

      <ExcelUploader
        onFileSelected={handleFileSelected}
        onParseComplete={handleParseComplete}
        isLoading={isLoading}
      />
    </View>
  );

  const renderQuizStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={handleBackToUpload}
        >
          <Ionicons name="arrow-back" size={24} color={Theme.dark.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{quizTitle}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Question {currentIndex + 1} of {questions.length}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentIndex + 1) / questions.length) * 100}%` }
            ]} 
          />
        </View>
      </View>

      <QuizQuestionCard
        question={questions[currentIndex]}
        onAnswerSelect={(value) => handleAnswerSelect(currentIndex, value)}
        selectedAnswer={userAnswers[currentIndex]}
      />

      <NavigationButtons
        currentIndex={currentIndex}
        total={questions.length}
        onPrev={handlePrevious}
        onNext={handleNext}
        onBack={handleBackToUpload}
        onSubmit={handleSubmit}
      />
    </View>
  );

  const renderResultsStep = () => {
    const score = calculateScore();
    const correctAnswers = Object.values(userAnswers).filter((answer, index) => 
      answer === questions[index].correctAnswer
    ).length;

    return (
      <View style={styles.stepContainer}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => setCurrentStep('quiz')}
          >
            <Ionicons name="arrow-back" size={24} color={Theme.dark.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Quiz Results</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.resultsContainer}>
          <View style={styles.scoreCard}>
            <LinearGradient
              colors={Theme.dark.gradient.primary}
              style={styles.scoreGradient}
            >
              <Text style={styles.scoreText}>{score}%</Text>
              <Text style={styles.scoreLabel}>Final Score</Text>
            </LinearGradient>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{correctAnswers}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{questions.length - correctAnswers}</Text>
              <Text style={styles.statLabel}>Incorrect</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{questions.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <Pressable
              style={styles.actionButton}
              onPress={handleBackToUpload}
            >
              <LinearGradient
                colors={Theme.dark.gradient.secondary}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="refresh" size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>New Quiz</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={styles.actionButton}
              onPress={() => {
                setCurrentStep('quiz');
                setCurrentIndex(0);
                setUserAnswers({});
              }}
            >
              <LinearGradient
                colors={Theme.dark.gradient.primary}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="play" size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>Retake</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return <LoadingSpinner message="Processing Excel file..." />;
  }

  return (
    <LinearGradient
      colors={['#0a0a0a', '#1a1a1a', '#0a0a0a']}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 'upload' && renderUploadStep()}
        {currentStep === 'quiz' && renderQuizStep()}
        {currentStep === 'results' && renderResultsStep()}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Theme.dark.glass.background,
    borderWidth: 1,
    borderColor: Theme.dark.glass.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.dark.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.dark.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: Theme.dark.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Theme.dark.accent,
    borderRadius: 2,
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCard: {
    marginBottom: 32,
    borderRadius: 20,
    overflow: 'hidden',
    ...Theme.dark.shadow.medium,
  },
  scoreGradient: {
    paddingVertical: 40,
    paddingHorizontal: 60,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 32,
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: Theme.dark.glass.background,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Theme.dark.glass.border,
    minWidth: 80,
    ...Theme.dark.shadow.soft,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.dark.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.dark.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Theme.dark.shadow.medium,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
