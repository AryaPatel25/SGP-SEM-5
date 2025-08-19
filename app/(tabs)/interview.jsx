// app/(tabs)/Interview.jsx
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { db } from "../../firebase/firebaseConfig";
import DomainCard from "../components/DomainCard";
import InterviewResults from "../components/InterviewResults";
import LoadingSpinner from "../components/LoadingSpinner";
import NavigationButtons from "../components/NavigationButtons";
import QuestionCard from "../components/QuestionCard";
import QuizQuestionCard from "../components/QuizQuestionCard";

// Custom hook for managing interview state
const useInterviewState = () => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false); // <-- Add this line
  const [userAnswers, setUserAnswers] = useState({});
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [questionType, setQuestionType] = useState('descriptive'); // 'descriptive' or 'quiz'
  const [mode, setMode] = useState('normal'); // 'normal' or 'ai'

  const resetState = () => {
    setSelectedDomain(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setShowHint(false);
    setShowAnswer(false); // <-- Reset showAnswer
    setUserAnswers({});
    setError(null);
    setShowResults(false);
  };

  return {
    domains,
    setDomains,
    loading,
    setLoading,
    selectedDomain,
    setSelectedDomain,
    questions,
    setQuestions,
    questionsLoading,
    setQuestionsLoading,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    showHint,
    setShowHint,
    showAnswer,
    setShowAnswer, // <-- Return these
    userAnswers,
    setUserAnswers,
    error,
    setError,
    showResults,
    setShowResults,
    resetState,
    questionType,
    setQuestionType,
    mode,
    setMode,
  };
};

// Custom hook for animations
const useAnimations = () => {
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return { fadeAnim, slideAnim, animateIn, animateOut };
};

// Progress Indicator Component
const ProgressIndicator = ({ current, total }) => {
  const progress = (current / total) * 100;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {current} of {total} questions
      </Text>
    </View>
  );
};

const InterviewScreen = () => {
  const {
    domains,
    setDomains,
    loading,
    setLoading,
    selectedDomain,
    setSelectedDomain,
    questions,
    setQuestions,
    questionsLoading,
    setQuestionsLoading,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    showHint,
    setShowHint,
    showAnswer,
    setShowAnswer,
    userAnswers,
    setUserAnswers,
    error,
    setError,
    showResults,
    setShowResults,
    resetState,
    questionType,
    setQuestionType,
    mode,
    setMode,
  } = useInterviewState();

  const { fadeAnim, slideAnim, animateIn, animateOut } = useAnimations();

  const [showQuestionCountInput, setShowQuestionCountInput] = useState(false);
  const [pendingDomain, setPendingDomain] = useState(null);
  const [questionCount, setQuestionCount] = useState('5'); // default

  // Memoized values
  const currentQuestion = useMemo(() =>
    questions[currentQuestionIndex] || null,
    [questions, currentQuestionIndex]
  );

  const currentUserAnswer = useMemo(() =>
    userAnswers[currentQuestionIndex] || "",
    [userAnswers, currentQuestionIndex]
  );

  // Filter domains based on selected question type
  const filteredDomains = useMemo(() => {
    if (mode === 'ai') {
      return domains; // Show all domains in AI mode
    }
    if (questionType === 'quiz') {
      return domains.filter(domain => Array.isArray(domain.quizQuestions) && domain.quizQuestions.length > 0);
    } else {
      return domains.filter(domain => Array.isArray(domain.descriptiveQuestions) && domain.descriptiveQuestions.length > 0);
    }
  }, [domains, questionType, mode]);

  // Fetch domains on mount
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        setError(null);
        const snapshot = await getDocs(collection(db, "interview_domains"));
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDomains(items);
      } catch (err) {
        console.error("Error fetching interview domains:", err);
        setError("Failed to load domains. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchDomains();
  }, [setDomains, setLoading, setError]);

  // Fetch questions for selected domain
  const fetchQuestions = useCallback(async (domain) => {
    if (!domain?.id) {
      Alert.alert("Error", "Invalid domain selected");
      return;
    }
    try {
      setError(null);
      setSelectedDomain(domain);
      setQuestions([]);
      setQuestionsLoading(true);
      setCurrentQuestionIndex(0);
      setShowHint(false);
      setUserAnswers({});
      const docRef = doc(db, "interview_domains", domain.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        let questionsData = [];
        if (questionType === 'quiz') {
          questionsData = data.quizQuestions || [];
        } else {
          questionsData = data.descriptiveQuestions || [];
        }
        setQuestions(questionsData);
        if (questionsData.length === 0) {
          setError("No questions found for this domain and type.");
        }
      } else {
        setError("Domain not found.");
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError("Failed to load questions. Please try again.");
    } finally {
      setQuestionsLoading(false);
    }
  }, [setSelectedDomain, setQuestions, setQuestionsLoading, setCurrentQuestionIndex, setShowAnswer, setUserAnswers, setError, questionType]);

  const generateAIQuestions = async (domain, count) => {
    setSelectedDomain(domain);
    setQuestions([]);
    setQuestionsLoading(true);
    setCurrentQuestionIndex(0);
    setShowHint(false);
    setUserAnswers({});
    setError(null);

    try {
      const backendUrl = 'http://10.70.32.90:5000/generate-question'; // <-- CHANGE THIS TO YOUR LOCAL IP IF NEEDED
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: '',
          questionType,
          domain,
          count
        }),
      });
      const data = await response.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        setError('No questions generated');
      }
    } catch (err) {
      setError('Failed to generate question');
    }
    setQuestionsLoading(false);
  };

  // Refactored domain click handler
  const handleDomainClick = useCallback((domain) => {
    if (mode === 'ai') {
      setPendingDomain(domain);
      setShowQuestionCountInput(true);
    } else {
      setSelectedDomain(domain);
      setQuestions([]);
      setQuestionsLoading(true);
      setCurrentQuestionIndex(0);
      setShowHint(false);
      setUserAnswers({});
      setError(null);
      fetchQuestions(domain);
      setQuestionsLoading(false);
    }
  }, [mode, fetchQuestions, setSelectedDomain, setQuestions, setQuestionsLoading, setCurrentQuestionIndex, setShowAnswer, setUserAnswers, setError]);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    if (currentQuestionIndex > 0) {
      animateOut();
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev - 1);
        setShowHint(false);
        animateIn();
      }, 200);
    }
  }, [currentQuestionIndex, setCurrentQuestionIndex, setShowAnswer, animateIn, animateOut]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      animateOut();
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setShowHint(false);
        animateIn();
      }, 200);
    }
  }, [currentQuestionIndex, questions.length, setCurrentQuestionIndex, setShowAnswer, animateIn, animateOut]);

  const handleAnswerChange = useCallback((index, text) => {
    setUserAnswers(prev => ({
      ...prev,
      [index]: text
    }));
  }, [setUserAnswers]);

  const handleToggleHint = useCallback(() => {
    setShowHint(prev => !prev);
  }, [setShowHint]);

  const handleBackToDomains = useCallback(() => {
    resetState();
  }, [resetState]);

  const handleSubmitInterview = useCallback(() => {
    setShowResults(true);
  }, [setShowResults]);

  const handleRetakeInterview = useCallback(() => {
    setShowResults(false);
    setTimeout(() => {
      setCurrentQuestionIndex(0);
      setShowAnswer(false);
      setUserAnswers({});
    }, 0);
  }, [setShowResults, setCurrentQuestionIndex, setShowAnswer, setUserAnswers]);

  useEffect(() => {
    if (questions.length > 0) {
      animateIn();
    }
  }, [questions, animateIn]);

  if (loading) {
    return <LoadingSpinner message="Loading domains..." />;
  }

  if (error && !selectedDomain) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#18181b' }}>
      {/* Modal for question count input */}
      {showQuestionCountInput && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>How many questions?</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              value={questionCount}
              onChangeText={setQuestionCount}
              placeholder="Enter number"
              placeholderTextColor="#888"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setShowQuestionCountInput(false);
                  setPendingDomain(null);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={async () => {
                  setShowQuestionCountInput(false);
                  if (pendingDomain) {
                    await generateAIQuestions(pendingDomain, parseInt(questionCount, 10) || 5);
                    setPendingDomain(null);
                  }
                }}
              >
                <Text style={styles.modalButtonText}>Generate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      <Text style={styles.pageTitle}>Interview Practice</Text>
      <View style={styles.divider} />
      {/* Mode Selector */}
      <View style={styles.typeSelectorContainer}>
        <TouchableOpacity
          style={[styles.typeButton, mode === 'normal' && styles.typeButtonActive]}
          onPress={() => { resetState(); setMode('normal'); }}
        >
          <Text style={[styles.typeButtonText, mode === 'normal' && styles.typeButtonTextActive]}>Normal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, mode === 'ai' && styles.typeButtonActive]}
          onPress={() => { resetState(); setMode('ai'); }}
        >
          <Text style={[styles.typeButtonText, mode === 'ai' && styles.typeButtonTextActive]}>AI Generate</Text>
        </TouchableOpacity>
      </View>
      {/* Question Type Selector */}
      <View style={styles.typeSelectorContainer}>
        <TouchableOpacity
          style={[styles.typeButton, questionType === 'descriptive' && styles.typeButtonActive]}
          onPress={() => {
            resetState();
            setQuestionType('descriptive');
          }}
        >
          <Text style={[styles.typeButtonText, questionType === 'descriptive' && styles.typeButtonTextActive]}>Descriptive</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, questionType === 'quiz' && styles.typeButtonActive]}
          onPress={() => {
            resetState();
            setQuestionType('quiz');
          }}
        >
          <Text style={[styles.typeButtonText, questionType === 'quiz' && styles.typeButtonTextActive]}>Quiz</Text>
        </TouchableOpacity>
      </View>
      {/* Domain selection */}
      {!selectedDomain && (
        <>
          <Text style={styles.sectionHeader}>Select a Domain</Text>
          {filteredDomains.length === 0 ? (
            <Text style={styles.noQuestions}>No domains available. Please add some!</Text>
          ) : (
            <FlatList
              style={styles.domainList}
              data={filteredDomains}
              renderItem={({ item }) => (
                <DomainCard
                  domain={item}
                  onPress={() => handleDomainClick(item)}
                  style={styles.domainCard}
                />
              )}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.domainRow}
            />
          )}
        </>
      )}
      {selectedDomain && (
        <>
          {questionsLoading ? (
            <LoadingSpinner message="Loading questions..." />
          ) : showResults ? (
            <InterviewResults
              questions={questions}
              userAnswers={userAnswers}
              onRetake={handleRetakeInterview}
              domain={selectedDomain}
              onBackToDomains={handleBackToDomains}
              questionType={questionType}
            />
          ) : (
            <View style={styles.questionContainer}>
              {questionType === 'quiz' ? (
                <QuizQuestionCard
                  question={currentQuestion}
                  index={currentQuestionIndex}
                  total={questions.length}
                  userAnswer={currentUserAnswer}
                  onAnswerChange={handleAnswerChange}
                />
              ) : (
                <QuestionCard
                  question={currentQuestion}
                  index={currentQuestionIndex}
                  total={questions.length}
                  userAnswer={currentUserAnswer}
                  onAnswerChange={handleAnswerChange}
                  showHint={showHint}
                  onToggleHint={handleToggleHint}
                />
              )}
              <NavigationButtons
                currentIndex={currentQuestionIndex}
                total={questions.length}
                onPrev={handlePrev}
                onNext={handleNext}
                onBack={handleBackToDomains}
                onSubmit={handleSubmitInterview}
              />
            </View>
          )}
        </>
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#18181b",
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginTop: 32,
    marginBottom: 8,
    letterSpacing: 1,
  },
  divider: {
    height: 2,
    backgroundColor: "#334155",
    marginHorizontal: 32,
    marginBottom: 16,
    borderRadius: 2,
  },
  domainList: {
    marginTop: 8,
    marginBottom: 24,
  },
  domainRow: {
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 16,
  },
  domainCard: {
    flex: 1,
    minWidth: 150,
    margin: 8,
    backgroundColor: "#23272e",
    padding: 20,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 130,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  domainCardActive: {
    transform: [{ scale: 1.04 }],
    backgroundColor: "#38bdf8",
  },
  domainTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
  },
  domainDescription: {
    fontSize: 13,
    color: "#a3a3a3",
    lineHeight: 18,
    marginBottom: 8,
  },
  domainMeta: {
    marginTop: 4,
  },
  domainQuestionCount: {
    fontSize: 12,
    color: "#38bdf8",
    fontWeight: "500",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#38bdf8",
    marginBottom: 8,
    marginLeft: 4,
  },
  progressContainer: {
    marginBottom: 20,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#334155",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#38bdf8",
    borderRadius: 4,
  },
  progressText: {
    color: "#a3a3a3",
    fontSize: 15,
    textAlign: "center",
    fontWeight: "500",
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  questionContainer: {
    marginBottom: 20,
  },
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
  noQuestions: {
    color: "#a3a3a3",
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
  },
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
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#38bdf8',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  retryButtonText: {
    color: '#18181b',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  typeSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 12,
  },
  typeButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#23272e',
    marginHorizontal: 4,
  },
  typeButtonActive: {
    backgroundColor: '#38bdf8',
  },
  typeButtonText: {
    color: '#a3a3a3',
    fontWeight: '600',
    fontSize: 16,
  },
  typeButtonTextActive: {
    color: '#18181b',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: '#23272e',
    padding: 24,
    borderRadius: 16,
    width: 300,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: '#18181b',
    color: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    width: '100%',
    marginBottom: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#38bdf8',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#18181b',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default InterviewScreen;
