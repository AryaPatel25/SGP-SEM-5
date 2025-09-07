import * as ExcelJS from 'exceljs';

/**
 * Generate a sample Excel file with quiz questions
 */
export async function generateSampleExcelFile(): Promise<string> {
  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  
  // Create a worksheet
  const worksheet = workbook.addWorksheet('Quiz Questions');
  
  // Add header row
  worksheet.addRow(['Question', 'Option 1', 'Option 2', 'Option 3', 'Option 4', 'Correct Answer']);
  
  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  
  // Add sample questions
  const sampleQuestions = [
    [
      'What is the capital of France?',
      'London',
      'Berlin', 
      'Paris',
      'Madrid',
      3
    ],
    [
      'Which programming language is known for web development?',
      'Python',
      'JavaScript',
      'C++',
      'Java',
      2
    ],
    [
      'What does HTML stand for?',
      'HyperText Markup Language',
      'High Tech Modern Language',
      'Home Tool Markup Language',
      'Hyperlink and Text Markup Language',
      1
    ],
    [
      'Which of the following is NOT a JavaScript data type?',
      'String',
      'Number',
      'Boolean',
      'Float',
      4
    ],
    [
      'What is the time complexity of accessing an element in an array by index?',
      'O(1)',
      'O(n)',
      'O(log n)',
      'O(n²)',
      1
    ]
  ];
  
  // Add sample questions to worksheet
  sampleQuestions.forEach(question => {
    worksheet.addRow(question);
  });
  
  // Auto-fit columns
  worksheet.columns.forEach(column => {
    column.width = 20;
  });
  
  // Generate the Excel file as base64
  const buffer = await workbook.xlsx.writeBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  
  return base64;
}

/**
 * Download the sample Excel file
 */
export async function downloadSampleExcelFile() {
  try {
    const excelBase64 = await generateSampleExcelFile();
    
    // Convert base64 to blob
    const byteCharacters = atob(excelBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quiz_template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading sample file:', error);
    throw new Error('Failed to download sample file');
  }
}
