import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

function parseQuizQuestions(text) {
  // Split by question number
  const questionBlocks = text.split(/\n\d+\. /).filter(Boolean);
  return questionBlocks.map(block => {
    // Extract question, options, and answer
    const lines = block.trim().split(/\n/).filter(Boolean);
    const questionLine = lines[0];
    const options = [];
    let answer = '';
    lines.slice(1).forEach(line => {
      const optMatch = line.match(/^[A-D]\)\s*(.*)$/);
      if (optMatch) options.push(optMatch[1]);
      const ansMatch = line.match(/^Answer:\s*([A-D])/i);
      if (ansMatch) answer = ansMatch[1];
    });
    return {
      question: questionLine,
      options,
      correct: answer
    };
  });
}

app.post('/generate-question', async (req, res) => {
  const { prompt, questionType, domain, count } = req.body;
  try {
    const numQuestions = count || 5;
    let fullPrompt;
    if (questionType === 'quiz') {
      fullPrompt = `Give me ${numQuestions} multiple-choice interview questions for the domain: ${domain.name}. For each question, provide 4 options (A, B, C, D) and specify the correct option. Return only the questions in the following format:\n1. Question text\nA) Option 1\nB) Option 2\nC) Option 3\nD) Option 4\nAnswer: [A/B/C/D]\n\n(Repeat for all ${numQuestions} questions. No explanations. Do not include anything except the questions, options, and answers in the format above.)`;
    } else {
      fullPrompt = `Give me ${numQuestions} interview-related questions which can be asked from this domain: ${domain.name}. Return only the questions as a numbered list, no explanations.`;
    }
    console.log('Prompt sent to Gemini:', fullPrompt);

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: fullPrompt }] }]
      }
    );
    const aiText = response.data.candidates[0].content.parts[0].text;
    console.log('Gemini raw response:', aiText);

    if (questionType === 'quiz') {
      const questions = parseQuizQuestions(aiText);
      console.log('Parsed quiz questions:', questions);
      res.json({ questions });
    } else {
      const questionsArray = aiText
        .split(/\n|\r/)
        .map(line => line.replace(/^\d+\.?\s*/, ''))
        .filter(q => q.trim() !== '');
      res.json({ questions: questionsArray.map(q => ({ question: q })) });
    }
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate question' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
