import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

// ✅ Load Gemini API key safely
const apiKey = process.env.GEMINI_API_KEY;

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

if (!apiKey) {
  throw new Error("CRITICAL: Gemini API key is missing.");
}

// ✅ Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey });

// ✅ Resume analysis function
export const analyzeResumeWithGemini = async (resumeText) => {
  const model = "gemini-2.5-flash";

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            text: `
You are an advanced AI recruiter.
Analyze the following resume text and return a valid JSON with these exact keys:
{
"name": "candidate full name",
"email": "email address",
"college": "college or university name",
"fitScore": "number between 0 and 100 indicating how suitable the candidate is for a software developer role"
}

Base the fitScore on their skills, projects, and technical experience.

Resume text:
${resumeText}
`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Candidate full name" },
            email: { type: Type.STRING, description: "Email address" },
            college: { type: Type.STRING, description: "College name" },
            fitScore: {
              type: Type.NUMBER,
              description:
                "Score between 0 and 100 based on suitability for software developer role",
            },
          },
          required: ["name", "email", "college", "fitScore"],
        },
      },
    });

    // Parse Gemini response safely
    const jsonString = response.text.trim();
    const parsed = JSON.parse(jsonString);

     // Insert data into Supabase
     try {
      const { data, error } = await supabase
      .from('resumes')
      .insert([
        {
          name: parsed.name,
          email: parsed.email,
          college: parsed.college,
          fit_score: parsed.fitScore,
        },
      ]);

      if (error) {
        console.error('Error inserting data into Supabase:', error);
      } else {
        console.log('Data inserted successfully:', data);
      }
    } catch (err) {
      console.error('An error occurred:', err);
    }


    return parsed;


  } catch (error) {
    console.error("❌ Gemini API error:", error);
    throw new Error("Failed to analyze resume text with Gemini.");
  }
};
