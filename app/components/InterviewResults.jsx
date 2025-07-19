import React, { useMemo } from 'react';
import {
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
  onRetakeInterview 
}) => {
  const { score, totalQuestions, answeredQuestions, correctAnswers } = useMemo(() => {
    const total = questions.length;
    const answered = Object.keys(userAnswers).length;
    const correct = questions.reduce((count, question, index) => {
      const userAnswer = userAnswers[index] || '';
      // Simple scoring - if user provided an answer, consider it correct
      // You can implement more sophisticated scoring logic here
      return count + (userAnswer.trim().length > 0 ? 1 : 0);
    }, 0);
    
    return {
      score: Math.round((correct / total) * 100),
      totalQuestions: total,
      answeredQuestions: answered,
      correctAnswers: correct
    };
  }, [questions, userAnswers]);

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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Interview Practice Results</Text>
        <Text style={styles.subtitle}>{domain.name}</Text>
      </View>

      {/* Score Card */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreText, { color: getScoreColor(score) }]}>
            {score}%
          </Text>
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
          
          return (
            <View key={index} style={styles.questionResult}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionNumber}>Q{index + 1}</Text>
                <View style={[
                  styles.statusIndicator, 
                  { backgroundColor: hasAnswered ? '#4CAF50' : '#F44336' }
                ]}>
                  <Text style={styles.statusText}>
                    {hasAnswered ? '✓' : '✗'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.questionText} numberOfLines={2}>
                {question.question}
              </Text>
              
              {hasAnswered && (
                <View style={styles.answerSection}>
                  <Text style={styles.answerLabel}>Your Answer:</Text>
                  <Text style={styles.userAnswer} numberOfLines={3}>
                    {userAnswer}
                  </Text>
                </View>
              )}
              
              <View style={styles.modelAnswerSection}>
                <Text style={styles.answerLabel}>Sample Answer:</Text>
                <Text style={styles.modelAnswer} numberOfLines={3}>
                  {question.answer}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.retakeButton} 
          onPress={onRetakeInterview}
        >
          <Text style={styles.retakeButtonText}>Practice Again</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBackToDomains}
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
    backgroundColor: '#000',
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#aaa',
    fontWeight: '500',
  },
  scoreCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#4f46e5',
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '700',
  },
  scoreMessage: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: '500',
  },
  resultsContainer: {
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  questionResult: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4f46e5',
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
    marginBottom: 12,
  },
  answerSection: {
    marginBottom: 12,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 4,
  },
  userAnswer: {
    fontSize: 13,
    color: '#ccc',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  modelAnswerSection: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 12,
  },
  modelAnswer: {
    fontSize: 13,
    color: '#aaa',
    lineHeight: 18,
  },
  actionButtons: {
    marginBottom: 40,
  },
  retakeButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#666',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InterviewResults; 