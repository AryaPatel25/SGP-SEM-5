// app/(tabs)/Interview.jsx
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../firebase/firebaseConfig";
import InterviewResults from "../components/InterviewResults";

// Custom hook for managing interview state
const useInterviewState = () => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const resetState = useCallback(() => {
    setSelectedDomain(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setShowAnswer(false);
    setUserAnswers({});
    setError(null);
    setShowResults(false);
  }, []);

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
    showAnswer,
    setShowAnswer,
    userAnswers,
    setUserAnswers,
    error,
    setError,
    showResults,
    setShowResults,
    resetState,
  };
};

// Custom hook for animations
const useAnimations = () => {
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  const animateIn = useCallback(() => {
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
  }, [fadeAnim, slideAnim]);

  const animateOut = useCallback(() => {
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
  }, [fadeAnim, slideAnim]);

  return { fadeAnim, slideAnim, animateIn, animateOut };
};

// Loading Component
const LoadingSpinner = ({ message = "Loading..." }) => (
  <View style={styles.centered}>
    <ActivityIndicator size="large" color="#4CAF50" />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

// Domain Card Component
const DomainCard = React.memo(({ domain, onPress, style }) => {
  const handlePress = useCallback(() => {
    onPress(domain);
  }, [domain, onPress]);

  return (
    <TouchableOpacity style={[styles.domainCard, style]} onPress={handlePress}>
      <Text style={styles.domainTitle}>{domain.name}</Text>
      <Text style={styles.domainDescription} numberOfLines={2}>
        {domain.description || "No description available"}
      </Text>
      <View style={styles.domainMeta}>
        <Text style={styles.domainQuestionCount}>
          {domain.questionCount || 0} questions
        </Text>
      </View>
    </TouchableOpacity>
  );
});

// Progress Indicator Component
const ProgressIndicator = ({ current, total }) => {
  const progress = useMemo(() => (current / total) * 100, [current, total]);

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

// Question Component
const QuestionCard = React.memo(({ 
  question, 
  index, 
  total, 
  userAnswer, 
  onAnswerChange, 
  showAnswer, 
  onToggleAnswer 
}) => {
  const handleAnswerChange = useCallback((text) => {
    onAnswerChange(index, text);
  }, [index, onAnswerChange]);

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

// Navigation Component
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
    showAnswer,
    setShowAnswer,
    userAnswers,
    setUserAnswers,
    error,
    setError,
    showResults,
    setShowResults,
    resetState,
  } = useInterviewState();

  const { fadeAnim, slideAnim, animateIn, animateOut } = useAnimations();

  // Memoized values
  const currentQuestion = useMemo(() => 
    questions[currentQuestionIndex] || null, 
    [questions, currentQuestionIndex]
  );

  const currentUserAnswer = useMemo(() => 
    userAnswers[currentQuestionIndex] || "", 
    [userAnswers, currentQuestionIndex]
  );

  const progressPercentage = useMemo(() => 
    questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0, 
    [currentQuestionIndex, questions.length]
  );

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
      setShowAnswer(false);
      setUserAnswers({});

      const docRef = doc(db, "interview_domains", domain.id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const questionsData = data.questions || [];
        setQuestions(questionsData);
        
        if (questionsData.length === 0) {
          setError("No questions found for this domain.");
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
  }, [setSelectedDomain, setQuestions, setQuestionsLoading, setCurrentQuestionIndex, setShowAnswer, setUserAnswers, setError]);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    if (currentQuestionIndex > 0) {
      animateOut();
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev - 1);
        setShowAnswer(false);
        animateIn();
      }, 200);
    }
  }, [currentQuestionIndex, setCurrentQuestionIndex, setShowAnswer, animateIn, animateOut]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      animateOut();
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setShowAnswer(false);
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

  const handleToggleAnswer = useCallback(() => {
    setShowAnswer(prev => !prev);
  }, [setShowAnswer]);

  const handleBackToDomains = useCallback(() => {
    resetState();
  }, [resetState]);

  const handleSubmitInterview = useCallback(() => {
    setShowResults(true);
  }, [setShowResults]);

  const handleRetakeInterview = useCallback(() => {
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setShowAnswer(false);
    setUserAnswers({});
  }, [setShowResults, setCurrentQuestionIndex, setShowAnswer, setUserAnswers]);

  // Start animation when component mounts or questions change
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
    <View style={styles.container}>
      {!selectedDomain ? (
        <FlatList
          data={domains}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.domainList}
          columnWrapperStyle={styles.domainRow}
          renderItem={({ item }) => (
            <DomainCard domain={item} onPress={fetchQuestions} />
          )}
          showsVerticalScrollIndicator={false}
        />
      ) : showResults ? (
        <InterviewResults
          domain={selectedDomain}
          questions={questions}
          userAnswers={userAnswers}
          onBackToDomains={handleBackToDomains}
          onRetakeInterview={handleRetakeInterview}
        />
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.questionHeader}>
            {selectedDomain.name} Interview
          </Text>

          {questionsLoading ? (
            <LoadingSpinner message="Loading questions..." />
          ) : error ? (
            <View style={styles.centered}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : questions.length === 0 ? (
            <Text style={styles.noQuestions}>No questions found.</Text>
          ) : (
            <>
              <ProgressIndicator 
                current={currentQuestionIndex + 1} 
                total={questions.length} 
              />
              
              <Animated.View
                style={[
                  styles.questionContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <QuestionCard
                  question={currentQuestion}
                  index={currentQuestionIndex}
                  total={questions.length}
                  userAnswer={currentUserAnswer}
                  onAnswerChange={handleAnswerChange}
                  showAnswer={showAnswer}
                  onToggleAnswer={handleToggleAnswer}
                />
              </Animated.View>

              <NavigationButtons
                currentIndex={currentQuestionIndex}
                total={questions.length}
                onPrev={handlePrev}
                onNext={handleNext}
                onBack={handleBackToDomains}
                onSubmit={handleSubmitInterview}
              />
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  domainList: {
    paddingBottom: 20,
  },
  domainRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  domainCard: {
    width: (width - 48) / 2,
    backgroundColor: "#4f46e5",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 120,
  },
  domainTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  domainDescription: {
    fontSize: 13,
    color: "#ccc",
    lineHeight: 18,
    flex: 1,
  },
  domainMeta: {
    marginTop: 8,
  },
  domainQuestionCount: {
    fontSize: 12,
    color: "#aaa",
    fontWeight: "500",
  },
  questionHeader: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#333",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 3,
  },
  progressText: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionCard: {
    backgroundColor: "#1e1e1e",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
    color: "#4CAF50",
  },
  questionCount: {
    fontSize: 14,
    color: "#666",
  },
  questionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
    lineHeight: 24,
  },
  textInput: {
    backgroundColor: "#2c2c2c",
    color: "#fff",
    padding: 16,
    borderRadius: 12,
    minHeight: 120,
    textAlignVertical: "top",
    fontSize: 16,
    lineHeight: 22,
    borderWidth: 1,
    borderColor: "#444",
  },
  showAnswerButton: {
    backgroundColor: "#4f46e5",
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  showAnswerButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  answerContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
    marginBottom: 8,
  },
  answerText: {
    color: "#ccc",
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
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: "#333",
    opacity: 0.6,
  },
  navButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  backButton: {
    backgroundColor: "#666",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  noQuestions: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
  },
});

export default InterviewScreen;
