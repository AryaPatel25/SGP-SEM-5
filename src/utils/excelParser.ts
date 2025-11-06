import ExcelJS from 'exceljs';
import * as FileSystem from 'expo-file-system/legacy';

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  let binaryString: string;
  // @ts-ignore
  if (typeof atob === 'function') {
    // @ts-ignore
    binaryString = atob(base64);
  } else {
    // Fallback for environments that might provide Buffer (web/Expo web)
    // @ts-ignore
    binaryString = Buffer.from(base64, 'base64').toString('binary');
  }
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes.buffer;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct option (0-based)
  explanation?: string;
}

export interface ExcelParseResult {
  success: boolean;
  questions: QuizQuestion[];
  errors: string[];
  warnings: string[];
}

/**
 * Parse Excel file and extract quiz questions
 * Expected format:
 * Column A: Question
 * Column B: Option 1
 * Column C: Option 2
 * Column D: Option 3
 * Column E: Option 4
 * Column F: Correct Answer (1, 2, 3, or 4)
 */
export async function parseExcelQuizFile(fileUri: string): Promise<ExcelParseResult> {
  try {
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to ArrayBuffer (avoid Buffer recursion on RN/Hermes)
    const arrayBuffer = base64ToArrayBuffer(base64);
    
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    
    // Load the workbook from ArrayBuffer
    await workbook.xlsx.load(arrayBuffer);
    
    // Get the first worksheet
    const worksheet = workbook.worksheets[0];
    
    if (!worksheet) {
      return {
        success: false,
        questions: [],
        errors: ['No worksheet found in the Excel file'],
        warnings: []
      };
    }
    
    // Parse the data
    const questions: QuizQuestion[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if first row is a header
    const firstRow = worksheet.getRow(1);
    const isHeaderRow = firstRow.getCell(1).text?.toLowerCase().includes('question') || false;
    const startRow = isHeaderRow ? 2 : 1;

    // Iterate through rows
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber < startRow) return; // Skip header row
      
      try {
        const questionText = row.getCell(1).text?.trim() || '';
        const option1 = row.getCell(2).text?.trim() || '';
        const option2 = row.getCell(3).text?.trim() || '';
        const option3 = row.getCell(4).text?.trim() || '';
        const option4 = row.getCell(5).text?.trim() || '';
        const correctAnswerText = row.getCell(6).text?.trim() || '';

        // Skip empty rows
        if (!questionText) return;

        const options = [option1, option2, option3, option4].filter(option => option.length > 0);
        
        // Parse correct answer (convert from 1-based to 0-based)
        const correctAnswerNum = parseInt(correctAnswerText);
        
        if (isNaN(correctAnswerNum) || correctAnswerNum < 1 || correctAnswerNum > options.length) {
          errors.push(`Row ${rowNumber}: Invalid correct answer "${correctAnswerText}". Must be a number between 1 and ${options.length}`);
          return;
        }

        const question: QuizQuestion = {
          question: questionText,
          options: options,
          correctAnswer: correctAnswerNum - 1, // Convert to 0-based index
        };

        // Validate question
        if (question.question.length === 0) {
          errors.push(`Row ${rowNumber}: Question text is required`);
          return;
        }

        if (question.options.length < 2) {
          errors.push(`Row ${rowNumber}: At least 2 options are required`);
          return;
        }

        questions.push(question);
      } catch (rowError) {
        errors.push(`Row ${rowNumber}: ${rowError}`);
      }
    });

    if (questions.length === 0 && errors.length === 0) {
      errors.push('No valid questions found in the Excel file');
    }

    return {
      success: errors.length === 0,
      questions,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      success: false,
      questions: [],
      errors: [`Failed to parse Excel file: ${error}`],
      warnings: []
    };
  }
}

/**
 * Validate quiz questions data
 */
export function validateQuizQuestions(questions: QuizQuestion[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!questions || questions.length === 0) {
    errors.push('No questions found in the file');
    return { isValid: false, errors };
  }

  questions.forEach((question, index) => {
    if (!question.question || question.question.trim().length === 0) {
      errors.push(`Question ${index + 1}: Question text is required`);
    }

    if (!question.options || question.options.length < 2) {
      errors.push(`Question ${index + 1}: At least 2 options are required`);
    }

    if (question.options && question.options.length > 0) {
      question.options.forEach((option, optionIndex) => {
        if (!option || option.trim().length === 0) {
          errors.push(`Question ${index + 1}, Option ${optionIndex + 1}: Option text is required`);
        }
      });
    }

    if (question.correctAnswer < 0 || question.correctAnswer >= (question.options?.length || 0)) {
      errors.push(`Question ${index + 1}: Invalid correct answer index`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sample Excel data for testing
 */
export const sampleQuizData: QuizQuestion[] = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2,
    explanation: "Paris is the capital and largest city of France."
  },
  {
    question: "Which programming language is known for its use in web development?",
    options: ["Python", "JavaScript", "C++", "Java"],
    correctAnswer: 1,
    explanation: "JavaScript is primarily used for web development, especially for frontend development."
  },
  {
    question: "What does HTML stand for?",
    options: ["HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink and Text Markup Language"],
    correctAnswer: 0,
    explanation: "HTML stands for HyperText Markup Language, the standard markup language for web pages."
  }
];