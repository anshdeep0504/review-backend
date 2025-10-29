// utils/file_parsing.js
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import tesseract from 'tesseract.js';

async function extractTextFromPDF(file) {
    try {
        const dataBuffer = Buffer.from(file.data, 'base64');
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        return null;
    }
}

async function extractTextFromDOCX(file) {
    try {
        const dataBuffer = file.data;
        const result = await mammoth.extractRawText({ buffer: dataBuffer });
        return result.value;
    } catch (error) {
        console.error('Error extracting text from DOCX:', error);
        return null;
    }
}

async function extractTextFromImage(file) {
    try {
        const { data: { text } } = await tesseract.recognize(
            file.data,
            'eng',
            { logger: m => console.log(m) }
        );
        return text;
    } catch (error) {
        console.error('Error extracting text from image:', error);
        return null;
    }
}

export {
    extractTextFromPDF,
    extractTextFromDOCX,
    extractTextFromImage,
};