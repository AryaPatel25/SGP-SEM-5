// app/(tabs)/interview/index.jsx
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { db } from '../../../firebase/firebaseConfig';
import { buildBackendUrl } from '../../../src/utils/backendUrl';
import DomainCard from '../../components/DomainCard';
import InterviewResults from '../../components/InterviewResults';
import LoadingSpinner from '../../components/LoadingSpinner';
import NavigationButtons from '../../components/NavigationButtons';
import QuestionCard from '../../components/QuestionCard';
import QuizQuestionCard from '../../components/QuizQuestionCard';

const SAMPLE_DOMAINS = [
  { id: 'sample-1', name: 'JavaScript', description: 'Core JavaScript concepts, ES6+, and modern development practices', questionCount: 15,
    descriptiveQuestions: [
      { question: 'Explain the difference between var, let, and const in JavaScript.', hint: 'Think about scope and reassignment capabilities.' },
      { question: 'What are closures in JavaScript and how do they work?', hint: 'Consider function scope and lexical environment.' },
    ],
    quizQuestions: [
      { question: 'Which of the following is NOT a JavaScript data type?', options: ['String', 'Number', 'Boolean', 'Float'], correct: 3 },
      { question: "What does the 'this' keyword refer to in JavaScript?", options: ['The function itself', 'The global object', 'The object that owns the function', 'The parent function'], correct: 2 },
    ] },
  { id: 'sample-2', name: 'React', description: 'React fundamentals, hooks, and component lifecycle', questionCount: 12,
    descriptiveQuestions: [
      { question: 'Explain the difference between state and props in React.', hint: 'Think about data flow and mutability.' },
      { question: 'What are React hooks and when would you use them?', hint: 'Consider functional components and state management.' },
    ],
    quizQuestions: [
      { question: 'Which hook is used for side effects in functional components?', options: ['useState', 'useEffect', 'useContext', 'useReducer'], correct: 1 },
      { question: 'What is the correct way to update state in React?', options: ['Directly modify the state variable', 'Use the setter function', 'Use document.getElementById', 'Use innerHTML'], correct: 1 },
    ] },
  { id: 'sample-3', name: 'Data Structures', description: 'Arrays, objects, and common data structure operations', questionCount: 10,
    descriptiveQuestions: [
      { question: 'Explain the difference between an array and a linked list.', hint: 'Think about memory allocation and access patterns.' },
      { question: 'What is the time complexity of searching in a binary search tree?', hint: "Consider the tree structure and how it's organized." },
    ],
    quizQuestions: [
      { question: 'What is the time complexity of accessing an element in an array by index?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'], correct: 0 },
      { question: 'Which data structure uses LIFO (Last In, First Out)?', options: ['Queue', 'Stack', 'Tree', 'Graph'], correct: 1 },
    ] },
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
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setDomains(Array.isArray(items) && items.length > 0 ? items : SAMPLE_DOMAINS);
      } catch (e) {
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
    return domains.filter(d => d && Array.isArray(d[key]) && d[key].length > 0);
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

  const handleDomainPress = useCallback((domain) => {
    if (!domain) return;
    if (mode === 'ai') { setPendingDomain(domain); setShowCountModal(true); return; }
    loadQuestionsForDomain(domain);
  }, [mode]);

  const loadQuestionsForDomain = useCallback(async (domain) => {
    try {
      setError(null); setInnerError(null); setSelectedDomain(domain); setQuestions([]); setLoadingQuestions(true); setCurrentIndex(0); setUserAnswers({});
      if (typeof domain.id === 'string' && domain.id.startsWith('sample-')) {
        const key = questionType === 'quiz' ? 'quizQuestions' : 'descriptiveQuestions';
        const data = Array.isArray(domain[key]) ? domain[key] : [];
        setQuestions(data); if (data.length === 0) setInnerError('No questions found for this domain and type.'); return;
      }
      const ref = doc(db, 'interview_domains', domain.id); const snap = await getDoc(ref);
      if (!snap.exists()) { setInnerError('Domain not found.'); return; }
      const data = snap.data(); const key = questionType === 'quiz' ? 'quizQuestions' : 'descriptiveQuestions';
      const arr = Array.isArray(data[key]) ? data[key] : []; setQuestions(arr); if (arr.length === 0) setInnerError('No questions found for this domain and type.');
    } catch (e) { setInnerError('Failed to load questions. Please try again.'); }
    finally { setLoadingQuestions(false); }
  }, [questionType]);

  const generateAIQuestions = useCallback(async (domain, count) => {
    try {
      setError(null); setInnerError(null); setSelectedDomain(domain); setQuestions([]); setLoadingQuestions(true); setCurrentIndex(0); setUserAnswers({});
      const backendUrl = buildBackendUrl('/generate-question');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(backendUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: '', questionType, domain, count }), signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json(); const list = Array.isArray(data?.questions) ? data.questions : [];
      const normalized = list.map(q => {
        if (questionType === 'quiz') {
          if (typeof q === 'object') {
            return {
              question: q.question || q.text || '',
              options: Array.isArray(q.options) ? q.options : [],
              correct: q.correct, // expected to be 'A' | 'B' | 'C' | 'D'
            };
          }
          return { question: String(q || ''), options: [], correct: undefined };
        }
        // descriptive
        if (typeof q === 'object') {
          return { question: q.question || q.text || '', hint: q.hint || '' };
        }
        return { question: String(q || ''), hint: '' };
      });
      setQuestions(normalized); if (normalized.length === 0) setInnerError('No questions generated.');
    } catch {
      setInnerError('AI generation took too long or failed. Please try again or use Normal mode.');
    }
    finally { setLoadingQuestions(false); }
  }, [questionType]);

  const handleAnswerChange = useCallback((index, value) => { setUserAnswers(prev => ({ ...prev, [index]: value })); }, []);
  const handlePrev = useCallback(() => { setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev)); }, []);
  const handleNext = useCallback(() => { setCurrentIndex(prev => (prev < questions.length - 1 ? prev + 1 : prev)); }, [questions.length]);
  const handleSubmit = useCallback(() => { setShowResults(true); }, []);

  if (loadingDomains) return <LoadingSpinner message="Loading domains..." />;

  if (error && !selectedDomain && (!Array.isArray(domains) || domains.length === 0)) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.primaryButton} onPress={() => { setError(null); resetSession(); }}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Interview Practice</Text>
       <View style={styles.row}>
         <Pressable style={[styles.toggle, mode === 'normal' && styles.toggleActive]} onPress={() => { resetSession(); setMode('normal'); }}>
           <Text style={[styles.toggleText, mode === 'normal' && styles.toggleTextActive]}>Normal</Text>
         </Pressable>
         <Pressable style={[styles.toggle, mode === 'ai' && styles.toggleActive]} onPress={() => { resetSession(); setMode('ai'); }}>
           <Text style={[styles.toggleText, mode === 'ai' && styles.toggleTextActive]}>AI Generate</Text>
         </Pressable>
         <Pressable style={[styles.toggle, mode === 'custom' && styles.toggleActive]} onPress={() => { 
           resetSession(); 
           setMode('custom');
           router.push('/(tabs)/custom-quiz');
         }}>
           <Text style={[styles.toggleText, mode === 'custom' && styles.toggleTextActive]}>Custom Quiz</Text>
         </Pressable>
       </View>
      <View style={styles.row}>
        <Pressable style={[styles.toggle, questionType === 'descriptive' && styles.toggleActive]} onPress={() => { resetSession(); setQuestionType('descriptive'); }}>
          <Text style={[styles.toggleText, questionType === 'descriptive' && styles.toggleTextActive]}>Descriptive</Text>
        </Pressable>
        <Pressable style={[styles.toggle, questionType === 'quiz' && styles.toggleActive]} onPress={() => { resetSession(); setQuestionType('quiz'); }}>
          <Text style={[styles.toggleText, questionType === 'quiz' && styles.toggleTextActive]}>Quiz</Text>
        </Pressable>
      </View>

      {!selectedDomain && (
        <>
          <Text style={styles.sectionTitle}>Select a Domain</Text>
          {filteredDomains.length === 0 ? (
            <Text style={styles.noData}>No domains available for this type.</Text>
          ) : (
            <FlatList
              data={filteredDomains}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <DomainCard domain={item} onPress={() => handleDomainPress(item)} style={styles.domainItem} />
              )}
            />
          )}
        </>
      )}

      {selectedDomain && !showResults && (
        <>
          {loadingQuestions ? (
            <LoadingSpinner message="Loading questions..." />
          ) : (
            <View>
              <Text style={styles.sectionTitle}>{selectedDomain?.name}</Text>
              {(innerError || questions.length === 0) ? (
                <>
                  <View style={styles.errorCard}>
                    <Text style={styles.errorCardText}>{innerError || 'No questions available yet.'}</Text>
                    <View style={{ flexDirection: 'row', marginTop: 10 }}>
                      <Pressable style={[styles.secondaryButton, { marginRight: 6 }]} onPress={resetSession}>
                        <Text style={styles.secondaryButtonText}>Back</Text>
                      </Pressable>
                      <Pressable style={[styles.primaryButton, { marginLeft: 6 }]} onPress={() => {
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
                </>
              ) : (
                <>
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
                  <NavigationButtons
                    currentIndex={currentIndex}
                    total={questions.length}
                    onPrev={handlePrev}
                    onNext={handleNext}
                    onBack={resetSession}
                    onSubmit={handleSubmit}
                  />
                </>
              )}
            </View>
          )}
        </>
      )}

      {selectedDomain && showResults && (
        <InterviewResults
          domain={selectedDomain}
          questions={questions}
          userAnswers={userAnswers}
          onBackToDomains={resetSession}
          onRetakeInterview={() => { setShowResults(false); setCurrentIndex(0); setUserAnswers({}); }}
          questionType={questionType}
        />
      )}

      <Modal transparent visible={showCountModal} animationType="fade" onRequestClose={() => setShowCountModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>How many questions?</Text>
            <TextInput style={styles.modalInput} keyboardType="number-pad" value={questionCount} onChangeText={setQuestionCount} placeholder="Enter number" placeholderTextColor="#888" />
            <View style={styles.modalRow}>
              <Pressable style={[styles.secondaryButton, { marginRight: 6 }]} onPress={() => { setShowCountModal(false); setPendingDomain(null); }}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.primaryButton, { marginLeft: 6 }]} onPress={async () => { const n = parseInt(questionCount, 10) || 5; const domain = pendingDomain; setShowCountModal(false); setPendingDomain(null); if (domain) { await generateAIQuestions(domain, n); } }}>
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
  container: { flex: 1, backgroundColor: '#18181b', paddingHorizontal: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#18181b' },
  pageTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginTop: 24, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  toggle: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#23272e', borderRadius: 8, marginHorizontal: 4 },
  toggleActive: { backgroundColor: '#38bdf8' },
  toggleText: { color: '#a3a3a3', fontWeight: '600' },
  toggleTextActive: { color: '#18181b', fontWeight: '700' },
  sectionTitle: { color: '#38bdf8', fontSize: 16, fontWeight: 'bold', marginBottom: 8, marginTop: 8 },
  list: { paddingBottom: 24 },
  domainItem: { flex: 1, margin: 8 },
  noData: { color: '#a3a3a3', textAlign: 'center', marginTop: 24 },
  errorText: { color: '#ef4444', fontSize: 16, marginBottom: 16 },
  errorCard: { backgroundColor: '#23272e', padding: 24, borderRadius: 22, borderWidth: 1.5, borderColor: '#334155', marginBottom: 18 },
  errorCardText: { color: '#ef4444', fontSize: 16, marginBottom: 8 },
  primaryButton: { backgroundColor: '#38bdf8', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center' },
  primaryButtonText: { color: '#18181b', fontWeight: '800' },
  secondaryButton: { backgroundColor: '#23272e', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center' },
  secondaryButtonText: { color: '#38bdf8', fontWeight: '800' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#23272e', padding: 20, borderRadius: 12, width: 300 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  modalInput: { backgroundColor: '#18181b', color: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#334155', padding: 12, marginBottom: 12, textAlign: 'center' },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between' },
});



