import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import FormData from 'form-data';
import fs from 'fs'; // Added missing import for fs
import multer from 'multer';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

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

function parseDescriptiveQuestions(text) {
  const questions = [];
  const lines = text.split('\n');
  let currentQuestion = null;
  let currentHint = '';

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check if it's a question (starts with number)
    if (/^\d+\./.test(trimmedLine)) {
      if (currentQuestion) {
        questions.push({
          question: currentQuestion,
          hint: currentHint
        });
      }
      currentQuestion = trimmedLine.replace(/^\d+\.\s*/, '');
      currentHint = '';
    }
    // Check if it's a hint
    else if (trimmedLine.startsWith('Hint:')) {
      currentHint = trimmedLine.replace('Hint:', '').trim();
    }
  }

  // Add the last question
  if (currentQuestion) {
    questions.push({
      question: currentQuestion,
      hint: currentHint
    });
  }

  return questions;
}

app.post('/generate-question', async (req, res) => {
  const { prompt, questionType, domain, count } = req.body;
  try {
    const numQuestions = count || 5;
    let fullPrompt;
    if (questionType === 'quiz') {
      fullPrompt = `Give me ${numQuestions} multiple-choice interview questions for the domain: ${domain.name}. For each question, provide 4 options (A, B, C, D) and specify the correct option. Return only the questions in the following format:\n1. Question text\nA) Option 1\nB) Option 2\nC) Option 3\nD) Option 4\nAnswer: [A/B/C/D]\n\n(Repeat for all ${numQuestions} questions. No explanations. Do not include anything except the questions, options, and answers in the format above.)`;
                 } else {
               fullPrompt = `Give me ${numQuestions} interview-related questions which can be asked from this domain: ${domain.name}. For each question, also provide a brief hint (1-2 sentences) to help the user think about the answer. Return in this format:\n1. Question text\nHint: Brief hint here\n\n(Repeat for all ${numQuestions} questions. No explanations.)`;
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
               const questions = parseDescriptiveQuestions(aiText);
               console.log('Parsed descriptive questions:', questions);
               res.json({ questions });
             }
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate question' });
  }
});

app.post('/evaluate-answer', async (req, res) => {
  const { userAnswer, modelAnswer } = req.body;
  const prompt = `\nCompare the following user answer to the model answer. Give a score from 0 to 10 and a short feedback.\nModel answer: ${modelAnswer}\nUser answer: ${userAnswer}\nRespond in JSON: {"score": <number>, "feedback": "<short feedback>"}`;
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      }
    );
    const text = response.data.candidates[0].content.parts[0].text;
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      result = { score: null, feedback: text };
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to evaluate answer' });
  }
});

app.post('/generate-sample-answer', async (req, res) => {
  const { question } = req.body;
  const prompt = `Provide a brief model answer (3-5 sentences) for the following interview question:\n${question}\nPlease keep the answer brief (3-5 sentences).`;
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      }
    );
    const answer = response.data.candidates[0].content.parts[0].text;
    res.json({ answer });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate sample answer' });
  }
});

// Speech-to-Text endpoint using OpenAI Whisper API
app.post('/speech-to-text', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Read the audio file
    const audioFile = fs.readFileSync(req.file.path);

    // OpenAI Whisper API request
    const formData = new FormData();
    formData.append('file', audioFile, {
      filename: 'audio.wav',
      contentType: 'audio/wav'
    });
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    const speechResponse = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    const transcription = speechResponse.data.text || '';
    res.json({ text: transcription });
  } catch (error) {
    console.error('Speech-to-text error:', error.response?.data || error.message);
    
    // Clean up the uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to convert speech to text' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
