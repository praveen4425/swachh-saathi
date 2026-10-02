import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// Load environment variables from .env
dotenv.config();

// Initialize Gemini client using API key from .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function classifyWaste() {
  // Read local image file and convert to base64
  const imageBuffer = fs.readFileSync('samples/test.jpg');
  const base64Image = imageBuffer.toString('base64');

  const prompt = `Classify every waste item in this photo into the 4 streams from India's SWM Rules 2026:
- wet
- dry
- sanitary
- special_care

Return strictly valid JSON with this exact structure:
{"items":[{"name":"","stream":"","tip_hi":"one-line disposal tip in Hindi"}]}`;

  // Call the Gemini Flash model
  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
    },
  });

  // Print the JSON result
  console.log(response.text);
}

classifyWaste();
