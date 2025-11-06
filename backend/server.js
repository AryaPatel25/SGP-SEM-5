import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import * as ExcelJS from 'exceljs';
import express from 'express';
import fs from 'fs'; // Added missing import for fs
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists and serve it statically
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Configure multer for file uploads
const upload = multer({ dest: uploadsDir });

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
  const prompt = `\nCompare the following user answer to the model answer. Score from 0 to 10 and provide concise, polite, and constructive feedback focused on how to improve.\nTone & style rules:\n- Use second person voice addressing the candidate as \'you\' (never \'the user\' or third person).\n- Be direct, empathetic, and actionable.\n- Keep feedback to 1-2 sentences.\nModel answer: ${modelAnswer}\nUser answer: ${userAnswer}\nRespond ONLY in pure JSON (no code fences, no extra text): {"score": <number 0-10>, "feedback": "<1-2 sentences in second person, polite and productive>"}`;
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      }
    );
    let text = response.data.candidates[0].content.parts[0].text || '';
    // Clean code fences if present
    text = text.replace(/^```[a-zA-Z]*\n?/m, '').replace(/```\s*$/m, '');
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      // Try to extract json substring
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { result = JSON.parse(match[0]); } catch { result = { score: null, feedback: text }; }
      } else {
        result = { score: null, feedback: text };
      }
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

// Speech-to-Text endpoint using Deepgram API
app.post('/speech-to-text', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Stream the uploaded file directly to Deepgram
    const mimetype = req.file.mimetype || 'audio/m4a';
    const audioStream = fs.createReadStream(req.file.path);

    const dgResponse = await axios.post(
      'https://api.deepgram.com/v1/listen?smart_format=true&model=nova-2&punctuate=true',
      audioStream,
      {
        headers: {
          'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': mimetype,
        },
        maxBodyLength: Infinity,
      }
    );

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    const transcript =
      dgResponse.data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';

    return res.json({ text: transcript });
  } catch (error) {
    console.error('Deepgram STT error:', error.response?.data || error.message);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({ error: 'Failed to convert speech to text' });
  }
});

// Parse Excel quiz via backend (preferred for RN reliability)
app.post('/parse-excel', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, errors: ['No file uploaded'] });
  }
  const filePath = req.file.path;
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      fs.unlink(filePath, () => {});
      return res.status(400).json({ success: false, errors: ['No worksheet found'] });
    }
    const questions = [];
    const errors = [];
    const firstRow = worksheet.getRow(1);
    const isHeader = String(firstRow.getCell(1).value || '').toLowerCase().includes('question');
    const startRow = isHeader ? 2 : 1;
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber < startRow) return;
      const q = String(row.getCell(1).value || '').trim();
      const o1 = String(row.getCell(2).value || '').trim();
      const o2 = String(row.getCell(3).value || '').trim();
      const o3 = String(row.getCell(4).value || '').trim();
      const o4 = String(row.getCell(5).value || '').trim();
      const ca = String(row.getCell(6).value || '').trim();
      if (!q) return;
      const options = [o1, o2, o3, o4].filter(Boolean);
      const caNum = parseInt(ca);
      if (!options.length || isNaN(caNum) || caNum < 1 || caNum > options.length) {
        errors.push(`Row ${rowNumber}: Invalid row or correct answer`);
        return;
      }
      questions.push({ question: q, options, correctAnswer: caNum - 1 });
    });
    fs.unlink(filePath, () => {});
    if (!questions.length && !errors.length) errors.push('No valid questions found');
    return res.json({ success: errors.length === 0, questions, errors, warnings: [] });
  } catch (e) {
    try { fs.unlink(filePath, () => {}); } catch {}
    return res.status(500).json({ success: false, questions: [], errors: [String(e)], warnings: [] });
  }
});

// Upload mock interview video
app.post('/upload-interview', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No video uploaded' });
    }
    const filePath = `/uploads/${req.file.filename}`;
    return res.json({ success: true, file: filePath, originalName: req.file.originalname });
  } catch (e) {
    console.error('Upload interview error:', e);
    return res.status(500).json({ success: false, error: 'Failed to upload video' });
  }
});

// Sample Excel template download
app.get('/sample-excel', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'quiz_template.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="quiz_template.xlsx"');
  res.sendFile(filePath, err => {
    if (err) {
      console.error('Sample excel error:', err);
      res.status(500).json({ error: 'Failed to send sample excel' });
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
