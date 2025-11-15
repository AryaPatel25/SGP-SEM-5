import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking
} from 'react-native';
import GlassCard from '../../components/ui/GlassCard';
import { Theme } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

interface TipCategory {
  id: string;
  title: string;
  icon: string;
  tips: Array<{ title: string; description: string }>;
}

interface Resource {
  title: string;
  type: 'website' | 'book' | 'course' | 'tool';
  url?: string;
  description: string;
  icon: string;
}

const interviewTips: TipCategory[] = [
  {
    id: 'general',
    title: 'General Interview Tips',
    icon: '💼',
    tips: [
      {
        title: 'Research the Company',
        description: 'Learn about the company\'s mission, values, recent news, and products. This shows genuine interest and helps you tailor your answers.'
      },
      {
        title: 'Practice Your Elevator Pitch',
        description: 'Prepare a 30-60 second introduction about yourself. Include your background, key skills, and what you\'re looking for.'
      },
      {
        title: 'Prepare Questions to Ask',
        description: 'Have 2-3 thoughtful questions ready about the role, team, or company culture. This demonstrates engagement and critical thinking.'
      },
      {
        title: 'Dress Appropriately',
        description: 'Research the company culture and dress code. When in doubt, business professional is always safe.'
      },
      {
        title: 'Arrive Early',
        description: 'Plan to arrive 10-15 minutes early. This shows punctuality and gives you time to compose yourself.'
      }
    ]
  },
  {
    id: 'technical',
    title: 'Technical Interview Tips',
    icon: '💻',
    tips: [
      {
        title: 'Review Core Concepts',
        description: 'Brush up on fundamental concepts in your domain. Be ready to explain data structures, algorithms, or domain-specific knowledge.'
      },
      {
        title: 'Think Out Loud',
        description: 'Verbalize your thought process while solving problems. Interviewers want to see how you approach challenges, not just the answer.'
      },
      {
        title: 'Ask Clarifying Questions',
        description: 'Don\'t assume requirements. Ask questions to understand constraints, edge cases, and expected inputs/outputs before coding.'
      },
      {
        title: 'Start with Brute Force',
        description: 'Begin with a simple solution, then optimize. This shows problem-solving progression and ensures you have a working solution.'
      },
      {
        title: 'Test Your Solution',
        description: 'Walk through your code with test cases, including edge cases. This demonstrates attention to detail and thoroughness.'
      }
    ]
  },
  {
    id: 'behavioral',
    title: 'Behavioral Interview Tips',
    icon: '🤝',
    tips: [
      {
        title: 'Use the STAR Method',
        description: 'Structure answers using Situation, Task, Action, and Result. This ensures comprehensive, organized responses.'
      },
      {
        title: 'Prepare STAR Stories',
        description: 'Have 5-7 stories ready covering leadership, teamwork, problem-solving, failure, and success. Adapt them to different questions.'
      },
      {
        title: 'Be Specific and Quantifiable',
        description: 'Use numbers, metrics, and concrete examples. Instead of "improved sales," say "increased sales by 30% in Q2."'
      },
      {
        title: 'Show Growth Mindset',
        description: 'When discussing failures, focus on what you learned and how you improved. This shows resilience and self-awareness.'
      },
      {
        title: 'Align with Company Values',
        description: 'Research the company\'s values and incorporate examples that demonstrate alignment with their culture.'
      }
    ]
  },
  {
    id: 'mock',
    title: 'Mock Interview Preparation',
    icon: '🎬',
    tips: [
      {
        title: 'Practice Regularly',
        description: 'Schedule regular mock interviews to build confidence and identify areas for improvement. Consistency is key.'
      },
      {
        title: 'Record Yourself',
        description: 'Record your practice sessions to review body language, tone, and clarity. Notice filler words and work on eliminating them.'
      },
      {
        title: 'Time Your Answers',
        description: 'Keep answers concise (2-3 minutes for behavioral, 5-10 minutes for technical). Practice staying within time limits.'
      },
      {
        title: 'Get Feedback',
        description: 'Ask peers or mentors to conduct mock interviews and provide honest feedback on your performance.'
      },
      {
        title: 'Review Common Questions',
        description: 'Practice answering common questions for your domain. Prepare multiple examples for each type of question.'
      }
    ]
  }
];

const commonQuestions = {
  general: [
    { question: 'Tell me about yourself.', category: 'Opening' },
    { question: 'Why do you want to work here?', category: 'Motivation' },
    { question: 'What are your strengths?', category: 'Self-Assessment' },
    { question: 'What are your weaknesses?', category: 'Self-Assessment' },
    { question: 'Where do you see yourself in 5 years?', category: 'Career Goals' },
    { question: 'Why should we hire you?', category: 'Value Proposition' },
    { question: 'Do you have any questions for us?', category: 'Closing' }
  ],
  technical: [
    { question: 'Explain [technical concept] in simple terms.', category: 'Conceptual' },
    { question: 'How would you optimize this code?', category: 'Problem-Solving' },
    { question: 'Describe a challenging technical problem you solved.', category: 'Experience' },
    { question: 'How do you stay updated with technology?', category: 'Learning' },
    { question: 'Walk me through your approach to debugging.', category: 'Process' }
  ],
  behavioral: [
    { question: 'Tell me about a time you worked in a team.', category: 'Teamwork' },
    { question: 'Describe a situation where you had to handle conflict.', category: 'Conflict Resolution' },
    { question: 'Give an example of a time you failed and what you learned.', category: 'Failure & Learning' },
    { question: 'Tell me about a time you showed leadership.', category: 'Leadership' },
    { question: 'Describe a project you\'re proud of.', category: 'Achievement' }
  ]
};

const resources: Resource[] = [
  {
    title: 'LeetCode',
    type: 'website',
    url: 'https://leetcode.com',
    description: 'Practice coding problems and prepare for technical interviews',
    icon: '💻'
  },
  {
    title: 'HackerRank',
    type: 'website',
    url: 'https://www.hackerrank.com',
    description: 'Coding challenges and interview preparation resources',
    icon: '⚡'
  },
  {
    title: 'Cracking the Coding Interview',
    type: 'book',
    description: 'Comprehensive guide to technical interview preparation by Gayle Laakmann McDowell',
    icon: '📚'
  },
  {
    title: 'System Design Primer',
    type: 'website',
    url: 'https://github.com/donnemartin/system-design-primer',
    description: 'Learn how to design scalable systems for interviews',
    icon: '🏗️'
  },
  {
    title: 'Glassdoor Interview Questions',
    type: 'website',
    url: 'https://www.glassdoor.com',
    description: 'Browse real interview questions from companies',
    icon: '💼'
  },
  {
    title: 'Pramp',
    type: 'website',
    url: 'https://www.pramp.com',
    description: 'Free peer-to-peer mock interviews',
    icon: '🎯'
  },
  {
    title: 'InterviewBit',
    type: 'website',
    url: 'https://www.interviewbit.com',
    description: 'Structured interview preparation with coding problems',
    icon: '📖'
  },
  {
    title: 'Elements of Programming Interviews',
    type: 'book',
    description: 'In-depth technical interview preparation book',
    icon: '📘'
  }
];

const bestPractices = [
  {
    title: 'Before the Interview',
    items: [
      'Research the company and role thoroughly',
      'Prepare 5-7 STAR stories for behavioral questions',
      'Review your resume and be ready to discuss any point',
      'Prepare questions to ask the interviewer',
      'Test your technology (for virtual interviews)',
      'Plan your route and arrive early (for in-person)'
    ]
  },
  {
    title: 'During the Interview',
    items: [
      'Maintain eye contact and positive body language',
      'Listen carefully and ask clarifying questions',
      'Take your time before answering complex questions',
      'Use the STAR method for behavioral questions',
      'Show enthusiasm and genuine interest',
      'Be honest about what you don\'t know'
    ]
  },
  {
    title: 'After the Interview',
    items: [
      'Send a thank-you email within 24 hours',
      'Reflect on what went well and what to improve',
      'Follow up if you haven\'t heard back in a week',
      'Continue practicing and preparing',
      'Stay positive and keep applying'
    ]
  }
];

export default function TipsResourcesScreen() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedQuestionType, setExpandedQuestionType] = useState<string | null>(null);
  const [expandedPractice, setExpandedPractice] = useState<number | null>(null);

  const toggleCategory = (id: string) => {
    setExpandedCategory(expandedCategory === id ? null : id);
  };

  const toggleQuestionType = (type: string) => {
    setExpandedQuestionType(expandedQuestionType === type ? null : type);
  };

  const togglePractice = (index: number) => {
    setExpandedPractice(expandedPractice === index ? null : index);
  };

  const openResource = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={[Theme.dark.gradient.primary[0], Theme.dark.gradient.primary[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>💡 Tips & Resources</Text>
        <Text style={styles.headerSubtitle}>Your complete interview preparation guide</Text>
      </LinearGradient>

      {/* Interview Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interview Tips</Text>
        {interviewTips.map((category) => (
          <GlassCard key={category.id} style={styles.categoryCard}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => toggleCategory(category.id)}
            >
              <View style={styles.categoryHeaderLeft}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryTitle}>{category.title}</Text>
              </View>
              <Ionicons
                name={expandedCategory === category.id ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={Theme.dark.textSecondary}
              />
            </TouchableOpacity>
            {expandedCategory === category.id && (
              <View style={styles.tipsList}>
                {category.tips.map((tip, idx) => (
                  <View key={idx} style={styles.tipItem}>
                    <View style={styles.tipBullet} />
                    <View style={styles.tipContent}>
                      <Text style={styles.tipTitle}>{tip.title}</Text>
                      <Text style={styles.tipDescription}>{tip.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </GlassCard>
        ))}
      </View>

      {/* Common Questions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Common Interview Questions</Text>
        {Object.entries(commonQuestions).map(([type, questions]) => (
          <GlassCard key={type} style={styles.categoryCard}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => toggleQuestionType(type)}
            >
              <View style={styles.categoryHeaderLeft}>
                <Text style={styles.categoryIcon}>
                  {type === 'general' ? '💼' : type === 'technical' ? '💻' : '🤝'}
                </Text>
                <Text style={styles.categoryTitle}>
                  {type.charAt(0).toUpperCase() + type.slice(1)} Questions
                </Text>
              </View>
              <Ionicons
                name={expandedQuestionType === type ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={Theme.dark.textSecondary}
              />
            </TouchableOpacity>
            {expandedQuestionType === type && (
              <View style={styles.questionsList}>
                {questions.map((q, idx) => (
                  <View key={idx} style={styles.questionItem}>
                    <Text style={styles.questionText}>{q.question}</Text>
                    <Text style={styles.questionCategory}>{q.category}</Text>
                  </View>
                ))}
              </View>
            )}
          </GlassCard>
        ))}
      </View>

      {/* Best Practices */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Best Practices</Text>
        {bestPractices.map((practice, idx) => (
          <GlassCard key={idx} style={styles.categoryCard}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => togglePractice(idx)}
            >
              <View style={styles.categoryHeaderLeft}>
                <Text style={styles.categoryIcon}>
                  {idx === 0 ? '📋' : idx === 1 ? '🎯' : '✅'}
                </Text>
                <Text style={styles.categoryTitle}>{practice.title}</Text>
              </View>
              <Ionicons
                name={expandedPractice === idx ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={Theme.dark.textSecondary}
              />
            </TouchableOpacity>
            {expandedPractice === idx && (
              <View style={styles.practiceList}>
                {practice.items.map((item, itemIdx) => (
                  <View key={itemIdx} style={styles.practiceItem}>
                    <Text style={styles.practiceBullet}>•</Text>
                    <Text style={styles.practiceText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}
          </GlassCard>
        ))}
      </View>

      {/* Resources */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended Resources</Text>
        <View style={styles.resourcesGrid}>
          {resources.map((resource, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.resourceCard}
              onPress={() => openResource(resource.url)}
              disabled={!resource.url}
            >
              <Text style={styles.resourceIcon}>{resource.icon}</Text>
              <Text style={styles.resourceType}>
                {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
              </Text>
              <Text style={styles.resourceTitle}>{resource.title}</Text>
              <Text style={styles.resourceDescription}>{resource.description}</Text>
              {resource.url && (
                <View style={styles.resourceLink}>
                  <Text style={styles.resourceLinkText}>Visit →</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.dark.background,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.dark.textPrimary,
    marginBottom: 16,
  },
  categoryCard: {
    marginBottom: 12,
    padding: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.dark.textPrimary,
    flex: 1,
  },
  tipsList: {
    marginTop: 16,
    gap: 16,
  },
  tipItem: {
    flexDirection: 'row',
    gap: 12,
  },
  tipBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.dark.accent,
    marginTop: 6,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.dark.textPrimary,
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    color: Theme.dark.textSecondary,
    lineHeight: 20,
  },
  questionsList: {
    marginTop: 16,
    gap: 12,
  },
  questionItem: {
    padding: 12,
    backgroundColor: Theme.dark.surface,
    borderRadius: 8,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.dark.textPrimary,
    marginBottom: 4,
  },
  questionCategory: {
    fontSize: 12,
    color: Theme.dark.accent,
    fontWeight: '600',
  },
  practiceList: {
    marginTop: 16,
    gap: 10,
  },
  practiceItem: {
    flexDirection: 'row',
    gap: 8,
  },
  practiceBullet: {
    fontSize: 16,
    color: Theme.dark.accent,
    fontWeight: '800',
  },
  practiceText: {
    fontSize: 14,
    color: Theme.dark.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  resourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  resourceCard: {
    width: '48%',
    backgroundColor: Theme.dark.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    minHeight: 180,
  },
  resourceIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  resourceType: {
    fontSize: 10,
    color: Theme.dark.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.dark.textPrimary,
    marginBottom: 6,
  },
  resourceDescription: {
    fontSize: 12,
    color: Theme.dark.textSecondary,
    lineHeight: 16,
    flex: 1,
  },
  resourceLink: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Theme.dark.border,
  },
  resourceLinkText: {
    fontSize: 12,
    color: Theme.dark.accent,
    fontWeight: '700',
  },
  footer: {
    height: 24,
  },
});

