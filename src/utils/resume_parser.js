// utils/resume_parser.js

import { extractTextFromPDF, extractTextFromDOCX, extractTextFromImage } from './file_parsing.js';


/**
 * Parse and analyze resume
 */
async function parseResume(file, filename) {
  let extractedText = null;

  if (filename.endsWith('.pdf')) {
    extractedText = await extractTextFromPDF(file);
  } else if (filename.endsWith('.docx')) {
    extractedText = await extractTextFromDOCX(file);
  } else if (filename.toLowerCase().endsWith('.png') || filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg')) {
        extractedText = await extractTextFromImage(file);
    } else {
    console.log('Unsupported file type');
    return null;
  }

  if (!extractedText) {
    console.log('Failed to extract text from resume');
    return null;
  }

  const name = extractedText ? extractedText.split('\n')[0] : '';
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
  const email = extractedText ? extractedText.match(emailRegex)?.[0] : '';
  const fitScore = 0; // Default fit score

  return {
    text: extractedText,
    name: name,
    email: email,
    skills: ["skill1", "skill2"],
    college: "Some college",
    fitScore: fitScore
  };
}


function calculateFitScore(resumeText, jobDescription) {
    if (!jobDescription) {
        console.warn("Job description is missing. Returning a default fit score of 0.");
        return 0;
    }
  // Placeholder implementation: score based on keyword matches
  const keywords = jobDescription.split(/\s+/);
  let score = 0;
  for (const keyword of keywords) {
    if (resumeText.toLowerCase().includes(keyword.toLowerCase())) {
      score++;
    }
  }
  return score;
}

export { parseResume, calculateFitScore };