// app/(tabs)/interview/index.jsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../../../constants/Colors';
import { db } from '../../../firebase/firebaseConfig';
import { buildBackendUrl } from '../../../src/utils/backendUrl';
import DomainCard from '../../components/DomainCard';
import InterviewResults from '../../components/InterviewResults';
import LoadingSpinner from '../../components/LoadingSpinner';
import NavigationButtons from '../../components/NavigationButtons';
import QuestionCard from '../../components/QuestionCard';
import QuizQuestionCard from '../../components/QuizQuestionCard';
import GlassCard from '../../../components/ui/GlassCard';

const SAMPLE_DOMAINS = [
  {
    id: 'sample-1',
    name: 'JavaScript',
    description: 'Core JavaScript concepts, ES6+, and modern development practices',
    questionCount: 15,
    descriptiveQuestions: [
      { question: 'Explain the difference between var, let, and const in JavaScript.', hint: 'Think about scope and reassignment capabilities.' },
      { question: 'What are closures in JavaScript and how do they work?', hint: 'Consider function scope and lexical environment.' },
    ],
    quizQuestions: [
      { question: 'Which of the following is NOT a JavaScript data type?', options: ['String', 'Number', 'Boolean', 'Float'], correct: 3 },
      { question: "What does the 'this' keyword refer to in JavaScript?", options: ['The function itself', 'The global object', 'The object that owns the function', 'The parent function'], correct: 2 },
    ],
  },
  {
    id: 'sample-2',
    name: 'React',
    description: 'React fundamentals, hooks, and component lifecycle',
    questionCount: 12,
    descriptiveQuestions: [
      { question: 'Explain the difference between state and props in React.', hint: 'Think about data flow and mutability.' },
      { question: 'What are React hooks and when would you use them?', hint: 'Consider functional components and state management.' },
    ],
    quizQuestions: [
      { question: 'Which hook is used for side effects in functional components?', options: ['useState', 'useEffect', 'useContext', 'useReducer'], correct: 1 },
      { question: 'What is the correct way to update state in React?', options: ['Directly modify the state variable', 'Use the setter function', 'Use document.getElementById', 'Use innerHTML'], correct: 1 },
    ],
  },
  {
    id: 'sample-3',
    name: 'Data Structures',
    description: 'Arrays, objects, and common data structure operations',
    questionCount: 10,
    descriptiveQuestions: [
      { question: 'Explain the difference between an array and a linked list.', hint: 'Think about memory allocation and access patterns.' },
      { question: 'What is the time complexity of searching in a binary search tree?', hint: "Consider the tree structure and how it's organized." },
    ],
    quizQuestions: [
      { question: 'What is the time complexity of accessing an element in an array by index?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'], correct: 0 },
      { question: 'Which data structure uses LIFO (Last In, First Out)?', options: ['Queue', 'Stack', 'Tree', 'Graph'], correct: 1 },
    ],
  },
];

export default function InterviewScreen() {
  const router = useRouter();
  const [mode, setMode] = useState('normal');
  const [questionType, setQuestionType] = useState('descriptive');
  const [domains, setDomains] = useState([]);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [showCountModal, setShowCountModal] = useState(false);
  const [pendingDomain, setPendingDomain] = useState(null);
  const [questionCount, setQuestionCount] = useState('5');
  const [innerError, setInnerError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoadingDomains(true);
        setError(null);
        const snap = await getDocs(collection(db, 'interview_domains'));
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setDomains(Array.isArray(items) && items.length > 0 ? items : SAMPLE_DOMAINS);
      } catch (_e) {
        setDomains(SAMPLE_DOMAINS);
      } finally {
        setLoadingDomains(false);
      }
    }
    load();
  }, []);

  const filteredDomains = useMemo(() => {
    if (!Array.isArray(domains)) return [];
    if (mode === 'ai') return domains;
    const key = questionType === 'quiz' ? 'quizQuestions' : 'descriptiveQuestions';
    return domains.filter((d) => d && Array.isArray(d[key]) && d[key].length > 0);
  }, [domains, mode, questionType]);

  const resetSession = useCallback(() => {
    setSelectedDomain(null);
    setQuestions([]);
    setLoadingQuestions(false);
    setCurrentIndex(0);
    setUserAnswers({});
    setShowResults(false);
    setInnerError(null);
  }, []);

  const handleDomainPress = useCallback(
    (domain) => {
      if (!domain) return;
      if (mode === 'ai') {
        setPendingDomain(domain);
        setShowCountModal(true);
        return;
      }
      loadQuestionsForDomain(domain);
    },
    [mode, loadQuestionsForDomain]
  );

  const loadQuestionsForDomain = useCallback(
    async (domain) => {
      try {
        setError(null);
        setInnerError(null);
        setSelectedDomain(domain);
        setQuestions([]);
        setLoadingQuestions(true);
        setCurrentIndex(0);
        setUserAnswers({});
        if (typeof domain.id === 'string' && domain.id.startsWith('sample-')) {
          const key = questionType === 'quiz' ? 'quizQuestions' : 'descriptiveQuestions';
          const data = Array.isArray(domain[key]) ? domain[key] : [];
          setQuestions(data);
          if (data.length === 0) setInnerError('No questions found for this domain and type.');
          return;
        }
        const ref = doc(db, 'interview_domains', domain.id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setInnerError('Domain not found.');
          return;
        }
        const data = snap.data();
        const key = questionType === 'quiz' ? 'quizQuestions' : 'descriptiveQuestions';
        const arr = Array.isArray(data[key]) ? data[key] : [];
        setQuestions(arr);
        if (arr.length === 0) setInnerError('No questions found for this domain and type.');
      } catch (_e) {
        setInnerError('Failed to load questions. Please try again.');
      } finally {
        setLoadingQuestions(false);
      }
    },
    [questionType]
  );

  const generateAIQuestions = useCallback(
    async (domain, count) => {
      try {
        setError(null);
        setInnerError(null);
        setSelectedDomain(domain);
        setQuestions([]);
        setLoadingQuestions(true);
        setCurrentIndex(0);
        setUserAnswers({});
        const backendUrl = buildBackendUrl('/generate-question');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(backendUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: '', questionType, domain, count }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const data = await res.json();
        const list = Array.isArray(data?.questions) ? data.questions : [];
        const normalized = list.map((q) => {
          if (questionType === 'quiz') {
            if (typeof q === 'object') {
              return {
                question: q.question || q.text || '',
                options: Array.isArray(q.options) ? q.options : [],
                correct: q.correct,
              };
            }
            return { question: String(q || ''), options: [], correct: undefined };
          }
          if (typeof q === 'object') {
            return { question: q.question || q.text || '', hint: q.hint || '' };
          }
          return { question: String(q || ''), hint: '' };
        });
        setQuestions(normalized);
        if (normalized.length === 0) setInnerError('No questions generated.');
      } catch {
        setInnerError('AI generation took too long or failed. Please try again or use Normal mode.');
      } finally {
        setLoadingQuestions(false);
      }
    },
    [questionType]
  );

  const handleAnswerChange = useCallback((index, value) => {
    setUserAnswers((prev) => ({ ...prev, [index]: value }));
  }, []);
  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < questions.length - 1 ? prev + 1 : prev));
  }, [questions.length]);
  const handleSubmit = useCallback(() => {
    setShowResults(true);
  }, []);

  if (loadingDomains) return <LoadingSpinner message="Loading domains..." />;

  if (error && !selectedDomain && (!Array.isArray(domains) || domains.length === 0)) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => {
            setError(null);
            resetSession();
          }}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={[Theme.dark.gradient.primary[0], Theme.dark.gradient.primary[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.pageTitle}>🎯 Interview Practice</Text>
          <Text style={styles.pageSubtitle}>Choose your mode and start practicing</Text>
        </LinearGradient>

        {/* Mode Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionHeaderTitle}>Mode Selection</Text>
          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggle, mode === 'normal' && styles.toggleActive]}
              onPress={() => {
                resetSession();
                setMode('normal');
              }}>
              <Ionicons 
                name="document-text" 
                size={18} 
                color={mode === 'normal' ? '#fff' : Theme.dark.textSecondary} 
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.toggleText, mode === 'normal' && styles.toggleTextActive]}>Normal</Text>
            </Pressable>
            <Pressable
              style={[styles.toggle, mode === 'ai' && styles.toggleActive]}
              onPress={() => {
                resetSession();
                setMode('ai');
              }}>
              <Ionicons 
                name="sparkles" 
                size={18} 
                color={mode === 'ai' ? '#fff' : Theme.dark.textSecondary} 
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.toggleText, mode === 'ai' && styles.toggleTextActive]}>AI Generate</Text>
            </Pressable>
            <Pressable
              style={[styles.toggle, mode === 'custom' && styles.toggleActive]}
              onPress={() => {
                resetSession();
                setMode('custom');
                router.push('/(tabs)/custom-quiz');
              }}>
              <Ionicons 
                name="create" 
                size={18} 
                color={mode === 'custom' ? '#fff' : Theme.dark.textSecondary} 
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.toggleText, mode === 'custom' && styles.toggleTextActive]}>Custom</Text>
            </Pressable>
          </View>
        </View>

        {/* Question Type Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionHeaderTitle}>Question Type</Text>
          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggle, questionType === 'descriptive' && styles.toggleActive]}
              onPress={() => {
                resetSession();
                setQuestionType('descriptive');
              }}>
              <Ionicons 
                name="text" 
                size={18} 
                color={questionType === 'descriptive' ? '#fff' : Theme.dark.textSecondary} 
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.toggleText, questionType === 'descriptive' && styles.toggleTextActive]}>Descriptive</Text>
            </Pressable>
            <Pressable
              style={[styles.toggle, questionType === 'quiz' && styles.toggleActive]}
              onPress={() => {
                resetSession();
                setQuestionType('quiz');
              }}>
              <Ionicons 
                name="checkbox" 
                size={18} 
                color={questionType === 'quiz' ? '#fff' : Theme.dark.textSecondary} 
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.toggleText, questionType === 'quiz' && styles.toggleTextActive]}>Quiz</Text>
            </Pressable>
          </View>
        </View>

        {/* Domain Selection */}
        {!selectedDomain && (
          <View style={styles.section}>
            <Text style={styles.sectionHeaderTitle}>📚 Select a Domain</Text>
            {filteredDomains.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <Ionicons name="folder-open-outline" size={48} color={Theme.dark.textSecondary} />
                <Text style={styles.noData}>No domains available for this type.</Text>
              </GlassCard>
            ) : (
              <View style={styles.domainGrid}>
                {filteredDomains.map((item) => (
                  <DomainCard 
                    key={item.id}
                    domain={item} 
                    onPress={() => handleDomainPress(item)} 
                    style={styles.domainItem} 
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Questions */}
      {selectedDomain && !showResults && (
        <View style={styles.questionsContainer}>
          {loadingQuestions ? (
            <LoadingSpinner message="Loading questions..." />
          ) : (
            <View style={{ flex: 1 }}>
              <View style={styles.domainHeader}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={resetSession}
                >
                  <Ionicons name="arrow-back" size={22} color={Theme.dark.textPrimary} />
                </TouchableOpacity>
                <Text 
                  style={styles.domainTitle}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {selectedDomain?.name}
                </Text>
                <View style={styles.placeholder} />
              </View>

              {(innerError || questions.length === 0) ? (
                <View style={styles.errorCard}>
                  <Text style={styles.errorCardText}>{innerError || 'No questions available yet.'}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 10 }}>
                    <Pressable style={[styles.secondaryButton, { marginRight: 6 }]} onPress={resetSession}>
                      <Text style={styles.secondaryButtonText}>Back</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.primaryButton, { marginLeft: 6 }]}
                      onPress={() => {
                        if (mode === 'ai') {
                          const n = parseInt(questionCount, 10) || 5;
                          generateAIQuestions(selectedDomain, n);
                        } else {
                          loadQuestionsForDomain(selectedDomain);
                        }
                      }}>
                      <Text style={styles.primaryButtonText}>Retry</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 4 }}
                    showsVerticalScrollIndicator={false}>
                    {questionType === 'quiz' ? (
                      <QuizQuestionCard
                        question={questions[currentIndex] || null}
                        index={currentIndex}
                        total={questions.length}
                        userAnswer={userAnswers[currentIndex] || ''}
                        onAnswerChange={handleAnswerChange}
                      />
                    ) : (
                      <QuestionCard
                        question={questions[currentIndex] || null}
                        index={currentIndex}
                        total={questions.length}
                        userAnswer={userAnswers[currentIndex] || ''}
                        onAnswerChange={handleAnswerChange}
                        showHint={false}
                        onToggleHint={() => {}}
                      />
                    )}
                  </ScrollView>

                  {/* Sticky Navigation */}
                  <View style={styles.navWrapper}>
                    <NavigationButtons
                      currentIndex={currentIndex}
                      total={questions.length}
                      onPrev={handlePrev}
                      onNext={handleNext}
                      onBack={resetSession}
                      onSubmit={handleSubmit}
                    />
                  </View>
                </>
              )}
            </View>
          )}
        </View>
      )}

      {/* Results */}
      {selectedDomain && showResults && (
        <InterviewResults
          domain={selectedDomain}
          questions={questions}
          userAnswers={userAnswers}
          onBackToDomains={resetSession}
          onRetakeInterview={() => {
            setShowResults(false);
            setCurrentIndex(0);
            setUserAnswers({});
          }}
          questionType={questionType}
        />
      )}

      {/* AI Question Count Modal */}
      <Modal transparent visible={showCountModal} animationType="fade" onRequestClose={() => setShowCountModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>How many questions?</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              value={questionCount}
              onChangeText={setQuestionCount}
              placeholder="Enter number"
              placeholderTextColor="#888"
            />
            <View style={styles.modalRow}>
              <Pressable
                style={[styles.secondaryButton, { marginRight: 6 }]}
                onPress={() => {
                  setShowCountModal(false);
                  setPendingDomain(null);
                }}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, { marginLeft: 6 }]}
                onPress={async () => {
                  const n = parseInt(questionCount, 10) || 5;
                  const domain = pendingDomain;
                  setShowCountModal(false);
                  setPendingDomain(null);
                  if (domain) {
                    await generateAIQuestions(domain, n);
                  }
                }}>
                <Text style={styles.primaryButtonText}>Generate</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    marginBottom: 24,
  },
  pageTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  pageSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.dark.textPrimary,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  toggle: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: Theme.dark.surface,
    borderWidth: 1.5,
    borderColor: Theme.dark.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.dark.shadow.soft,
  },
  toggleActive: {
    backgroundColor: Theme.dark.accent,
    borderColor: Theme.dark.accent,
    ...Theme.dark.shadow.glowPrimary,
  },
  toggleText: {
    color: Theme.dark.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  toggleTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  domainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  questionsContainer: {
    flex: 1,
    backgroundColor: Theme.dark.background,
  },
  domainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Theme.dark.background,
    borderBottomWidth: 1,
    borderBottomColor: Theme.dark.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.dark.border,
  },
  domainTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Theme.dark.textPrimary,
    textAlign: 'center',
    marginHorizontal: 12,
    lineHeight: 26,
  },
  placeholder: {
    width: 40,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.dark.background,
  },
  domainItem: {
    width: '48%',
  },
  noData: {
    color: Theme.dark.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: Theme.dark.error,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: Theme.dark.surface,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Theme.dark.danger,
    marginBottom: 18,
    marginHorizontal: 20,
    ...Theme.dark.shadow.soft,
  },
  errorCardText: {
    color: Theme.dark.error,
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: Theme.dark.accent,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    alignItems: 'center',
    ...Theme.dark.shadow.medium,
  },
  primaryButtonText: {
    color: Theme.dark.background,
    fontWeight: '800',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: Theme.dark.glass.background,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.dark.accent,
  },
  secondaryButtonText: {
    color: Theme.dark.accent,
    fontWeight: '800',
    fontSize: 15,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: Theme.dark.surface,
    padding: 28,
    borderRadius: 24,
    width: 320,
    borderWidth: 1.5,
    borderColor: Theme.dark.border,
    ...Theme.dark.shadow.medium,
  },
  modalTitle: {
    color: Theme.dark.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 14,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: Theme.dark.background,
    color: Theme.dark.textPrimary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.dark.glass.border,
    padding: 12,
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 16,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: Theme.dark.background,
    borderTopWidth: 1,
    borderColor: Theme.dark.glass.border,
  },
});

