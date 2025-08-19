import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const InterviewResults = ({ 
  domain, 
  questions, 
  userAnswers, 
  onBackToDomains,
  onRetakeInterview,
  questionType
}) => {
  const [evaluations, setEvaluations] = useState({});
  const [sampleAnswers, setSampleAnswers] = useState({});
  const [loadingSampleAnswers, setLoadingSampleAnswers] = useState(false);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);

  useEffect(() => {
    if (questionType === 'descriptive') {
      const fetchEvaluations = async () => {
        setLoadingEvaluations(true);
        const evals = {};
        for (let i = 0; i < questions.length; i++) {
          const userAnswer = userAnswers[i] || '';
          const modelAnswer = questions[i].answer || '';
          if (userAnswer.trim().length > 0 && modelAnswer.trim().length > 0) {
            try {
              const res = await fetch('http://10.70.32.90:5000/evaluate-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userAnswer, modelAnswer }),
              });
              const data = await res.json();
              evals[i] = data;
            } catch {
              evals[i] = { score: null, feedback: 'Could not evaluate.' };
            }
          }
        }
        setEvaluations(evals);
        setLoadingEvaluations(false);
      };
      fetchEvaluations();

      const fetchSampleAnswers = async () => {
        setLoadingSampleAnswers(true);
        const samples = {};
        for (let i = 0; i < questions.length; i++) {
          if (!questions[i].answer) {
            try {
              console.log('Requesting sample answer for:', questions[i].question);
              const res = await fetch('http://10.70.32.90:5000/generate-sample-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: questions[i].question }),
              });
              const data = await res.json();
              console.log('Sample answer response:', data);
              samples[i] = data.answer;
            } catch {
              samples[i] = 'Could not generate sample answer.';
            }
          }
        }
        setSampleAnswers(samples);
        setLoadingSampleAnswers(false);
      };
      fetchSampleAnswers();
    }
  }, [questions, userAnswers, questionType]);

  const { score, totalQuestions, answeredQuestions, correctAnswers } = useMemo(() => {
    const total = questions.length;
    const answered = Object.keys(userAnswers).length;
    let correct = 0;
    if (questionType === 'quiz') {
      correct = questions.reduce((count, question, index) => {
        const userAnswer = userAnswers[index] || '';
        return count + (userAnswer === question.options?.["ABCD".indexOf(question.correct)] ? 1 : 0);
      }, 0);
    } else {
      // Use Gemini's evaluation for correctness (score >= 7/10)
      correct = questions.reduce((count, question, index) => {
        return count + (evaluations[index] && typeof evaluations[index].score === 'number' && evaluations[index].score >= 7 ? 1 : 0);
      }, 0);
    }
    return {
      score: Math.round((correct / total) * 100),
      totalQuestions: total,
      answeredQuestions: answered,
      correctAnswers: correct
    };
  }, [questions, userAnswers, questionType, evaluations]);

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return 'Excellent! You\'re well prepared!';
    if (score >= 60) return 'Good work! Keep practicing to improve.';
    return 'Keep practicing to build confidence!';
  };

  if (loadingSampleAnswers || loadingEvaluations) {
    return (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingOverlayText}>Checking your answer...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Interview Practice Results</Text>
        <Text style={styles.subtitle}>{domain?.name || 'Domain'}</Text>
      </View>
      {/* Score Card */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreText, { color: getScoreColor(score) }]}> {score}% </Text>
        </View>
        <Text style={styles.scoreMessage}>{getScoreMessage(score)}</Text>
      </View>
      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalQuestions}</Text>
          <Text style={styles.statLabel}>Total Questions</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{answeredQuestions}</Text>
          <Text style={styles.statLabel}>Answered</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{correctAnswers}</Text>
          <Text style={styles.statLabel}>Practiced</Text>
        </View>
      </View>
      {/* Detailed Results */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Practice Questions Summary</Text>
        {questions.map((question, index) => {
          const userAnswer = userAnswers[index] || '';
          const hasAnswered = userAnswer.trim().length > 0;
          const isQuiz = questionType === 'quiz';
          let isCorrect = false;
          let correctAnswer = '';
          if (isQuiz) {
            const correctIdx = "ABCD".indexOf(question.correct);
            correctAnswer = question.options?.[correctIdx] || '';
            isCorrect = userAnswer === correctAnswer;
          } else {
            // Use Gemini's evaluation for correctness (score >= 7/10)
            isCorrect = evaluations[index] && typeof evaluations[index].score === 'number' ? evaluations[index].score >= 7 : false;
          }
          return (
            <View key={index} style={styles.questionResult}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionNumber}>Q{index + 1}</Text>
                <View style={[
                  styles.statusIndicator, 
                  { backgroundColor: isCorrect ? '#4CAF50' : '#F44336' }
                ]}>
                  <Text style={styles.statusText}>
                    {isCorrect ? '✓' : '✗'}
                  </Text>
                </View>
              </View>
              <Text style={styles.questionText} numberOfLines={2}>
                {question.question}
              </Text>
              {isQuiz && (
                <View style={styles.answerSection}>
                  <Text style={styles.answerLabel}>Your Answer:</Text>
                  <Text style={styles.userAnswer} numberOfLines={3}>
                    {userAnswer}
                  </Text>
                  <Text style={styles.answerLabel}>Correct Answer:</Text>
                  <Text style={styles.userAnswer} numberOfLines={3}>
                    {correctAnswer}
                  </Text>
                </View>
              )}
              {!isQuiz && hasAnswered && (
                <View style={styles.answerSection}>
                  <Text style={styles.answerLabel}>Your Answer:</Text>
                  <Text style={styles.userAnswer} numberOfLines={3}>
                    {userAnswer}
                  </Text>
                  {evaluations[index] && (
                    <>
                      <Text style={styles.answerLabel}>Gemini Score:</Text>
                      <Text style={styles.userAnswer} numberOfLines={1}>
                        {evaluations[index].score !== null ? evaluations[index].score + ' / 10' : 'N/A'}
                      </Text>
                      <Text style={styles.answerLabel}>Gemini Feedback:</Text>
                      <Text style={styles.userAnswer} numberOfLines={3}>
                        {evaluations[index].feedback}
                      </Text>
                    </>
                  )}
                </View>
              )}
              {!isQuiz && (
                <View style={styles.modelAnswerSection}>
                  <Text style={styles.answerLabel}>Sample Answer:</Text>
                  <Text style={styles.modelAnswer} numberOfLines={3}>
                    {question.answer ? question.answer : (sampleAnswers[index] === undefined ? 'Generating sample answer...' : sampleAnswers[index] || 'No sample answer.')}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.retakeButton} 
          onPress={() => {
            setEvaluations({});
            setSampleAnswers({});
            onRetakeInterview();
          }}
        >
          <Text style={styles.retakeButtonText}>Practice Again</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBackToDomains ? onBackToDomains : onRetakeInterview}
        >
          <Text style={styles.backButtonText}>Back to Domains</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
    paddingHorizontal: 18,
  },
  header: {
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 36,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#f1f5f9',
    marginBottom: 10,
    letterSpacing: 1.1,
  },
  subtitle: {
    fontSize: 19,
    color: '#38bdf8',
    fontWeight: '600',
  },
  scoreCard: {
    backgroundColor: '#23272e',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  scoreCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#18181b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 5,
    borderColor: '#38bdf8',
  },
  scoreText: {
    fontSize: 36,
    fontWeight: '900',
  },
  scoreMessage: {
    fontSize: 20,
    color: '#f1f5f9',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#23272e',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#38bdf8',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 13,
    color: '#a3a3a3',
    fontWeight: '600',
  },
  resultsContainer: {
    marginBottom: 28,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f1f5f9',
    marginBottom: 18,
  },
  questionResult: {
    backgroundColor: '#23272e',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  questionNumber: {
    fontSize: 17,
    fontWeight: '700',
    color: '#38bdf8',
  },
  statusIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  questionText: {
    fontSize: 16,
    color: '#f1f5f9',
    lineHeight: 22,
    marginBottom: 14,
  },
  answerSection: {
    marginBottom: 14,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38bdf8',
    marginBottom: 6,
  },
  userAnswer: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  modelAnswerSection: {
    borderTopWidth: 1.5,
    borderTopColor: '#333',
    paddingTop: 14,
  },
  modelAnswer: {
    fontSize: 15,
    color: '#a3a3a3',
    lineHeight: 20,
  },
  actionButtons: {
    marginBottom: 44,
  },
  retakeButton: {
    backgroundColor: '#38bdf8',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#38bdf8',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  retakeButtonText: {
    color: '#18181b',
    fontSize: 18,
    fontWeight: '800',
  },
  backButton: {
    backgroundColor: '#23272e',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  backButtonText: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: '800',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(24,24,27,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  loadingOverlayText: {
    color: '#38bdf8',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 18,
    textAlign: 'center',
  },
});

export default InterviewResults; 