import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
dotenv.config();
console.log(process.env);
import { createClient } from '@supabase/supabase-js';
import candidateRoutes from './routes/candidates.js';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';
import { promises as fs } from 'fs';
import { parseResume } from './utils/resume_parser.js';
import { analyzeResumeWithGemini } from "./utils/geminiAnalyzer.js";

const app = express();
const port = process.env.PORT || 3003;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

app.use(cors());
app.use(express.json());

// Routes
app.use('/candidates', candidateRoutes);

app.get('/gmail', async (req, res) => {
  await fetchEmails();
  res.send('Gmail processing triggered!');
});

// Function to get attachment data
async function getAttachmentData(gmail, userId, messageId, attachmentId) {
    try {
        const response = await gmail.users.messages.attachments.get({
            userId: userId,
            messageId: messageId,
            id: attachmentId,
        });
        return response.data;
    } catch (error) {
        console.error('Error getting attachment data:', error);
        return null;
    }
}

// Gmail integration (Simplified example)
async function fetchEmails() {
  try {
    const oAuth2Client = new OAuth2Client(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'http://localhost'
    );
    oAuth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    const res = await gmail.users.messages.list({
      userId: 'me',
      q: 'has:attachment',
      maxResults: 1, // Only fetch the latest message
    });
    const messages = res.data.messages;

    if (messages && messages.length > 0) {
      console.log('Found messages with attachments:', messages.length);

      const message = messages[0]; // Process only the first message
      const messageId = message.id;
      const messageDetails = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
      });

      const attachments = messageDetails.data.payload.parts.filter(
        (part) =>
          part.filename &&
          part.body.attachmentId &&
          part.filename.toLowerCase().endsWith('.pdf')
      );

      if (attachments.length > 0) {
        console.log("PDF attachment found");
        const attachment = attachments[0]; // Process only the first PDF attachment
        const attachmentId = attachment.body.attachmentId;
        const attachmentData = await getAttachmentData(
          gmail,
          'me',
          messageId,
          attachmentId
        );

        if (attachmentData) {
          const filename = attachment.filename;
          const data = attachmentData.data;
          console.log(`Downloaded attachment: ${filename}`);

          // Parse the resume
          const resumeData = await parseResume({ data: data, encoding: 'base64' }, filename);

          if (resumeData) {
            console.log('Extracted Text:', resumeData.text);
            console.log('Resume data:', JSON.stringify(resumeData, null, 2));

            // Save the extracted text to a file
            if (resumeData.text) {
              await fs.writeFile(
                'extracted_text.txt',
                resumeData.text
              );
              console.log(
                'Extracted text saved to extracted_text.txt'
              );
            }

             // Analyze resume with Gemini
             try {
              console.log("Resume Text:", resumeData.text);
              const analysis = await analyzeResumeWithGemini(resumeData.text);
              console.log("Gemini Analysis:", analysis);

              const response = await fetch('http://localhost:3003/candidates', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                      name: analysis.name || '',
                      email: analysis.email || '',
                      college: analysis.college || '',
                      fit_score: analysis.fitScore || 0,
                      resumeText: resumeData.text,
                  }),
              });

              if (response.ok) {
                  console.log('Candidate created successfully');
              } else {
                  console.error('Failed to create candidate');
              }
          } catch (geminiError) {
              console.error("Gemini analysis failed:", geminiError);
          }
         } else {
          console.log('Failed to parse resume');
        }
      }
      }
    } else {
      console.log('No messages with attachments found.');
    }
  } catch (err) {
    console.error('Gmail API error:', err.message, err.stack);
  }
}

async function createTables() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseService = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    // Check if the table exists before attempting to create it
    let { data: existingTable, error: tableError } = await supabaseService
      .from('resumes')
      .select('*')
      .limit(1);

    if (tableError) {
      // Table does not exist, create it
      let { error: createTableError } = await supabaseService.schema.createTable('resumes', {
        columns: [
          { name: 'id', type: 'SERIAL', primaryKey: true },
          { name: 'name', type: 'VARCHAR(255)', notNull: true },
          { name: 'email', type: 'VARCHAR(255)', notNull: true },
          { name: 'college', type: 'VARCHAR(255)' },
          { name: 'fit_score', type: 'INTEGER', notNull: true },
          { name: 'resumeText', type: 'TEXT' }
        ]
      });

      if (createTableError) {
        console.error('Error creating table:', createTableError);
      } else {
        console.log('resumes table created');
      }
    } else {
      console.log('resumes table already exists');
    }
  } catch (error) {
    console.error('Error creating tables:', error.message, error.stack);
  }
}


async function processEmails() {
    await fetchEmails();

}

async function main() {
    await createTables();
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });

    // Schedule email processing every 10 seconds
    setInterval(processEmails, 10000); // 10 seconds = 10000 milliseconds
}

main().catch((e) => {
    console.error(e.message, e.stack);
});
