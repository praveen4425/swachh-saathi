import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

// Load environment variables from .env
dotenv.config();

const app = express();
const port = 3000;

// Setup multer to store uploaded files in memory (5MB limit, image only)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_IMAGE_FILE'));
    }
  },
});

// Initialize Gemini client using API key from .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper to call Gemini with a fallback model if one is busy
async function callGemini(contents, responseMimeType = 'application/json') {
  try {
    return await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: contents,
      config: { responseMimeType },
    });
  } catch (err) {
    return await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: { responseMimeType },
    });
  }
}

// File path for reports database
const reportsFile = path.resolve('reports.json');

// Helper to read existing reports
function getReports() {
  if (!fs.existsSync(reportsFile)) {
    return [];
  }
  try {
    const data = fs.readFileSync(reportsFile, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (e) {
    return [];
  }
}

// Helper to save reports
function saveReports(reports) {
  fs.writeFileSync(reportsFile, JSON.stringify(reports, null, 2));
}

// Support JSON body parsing and serve static files
app.use(express.json());
app.use(express.static('public'));

// POST /classify: Classify waste items in photo
app.post('/classify', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please upload an image' });
  }

  try {
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';

    const prompt = `Classify every waste item in this photo into the 4 streams from India's SWM Rules 2026:
- wet
- dry
- sanitary
- special_care

Return strictly valid JSON with this exact structure:
{"items":[{"name":"","stream":"","tip_hi":"one-line disposal tip in Hindi"}]}`;

    const response = await callGemini([
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
        ],
      },
    ]);

    const data = JSON.parse(response.text);
    res.json(data);
  } catch (error) {
    console.error('Classification error:', error);
    res.status(500).json({ error: error.message || 'Something went wrong' });
  }
});

// POST /report: Analyze dump photo and save report
app.post('/report', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please upload a photo of the dump' });
  }

  try {
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';
    const lat = req.body.lat ? parseFloat(req.body.lat) : null;
    const lng = req.body.lng ? parseFloat(req.body.lng) : null;
    const note = req.body.note || '';

    const prompt = `Analyze this image for an open garbage / waste dump or littered spot in an Indian city or neighbourhood.
Determine if it is indeed a garbage dump or illegally dumped waste pile.

Return strictly valid JSON with this exact structure:
{
  "is_dump": true or false,
  "severity": "low" or "medium" or "high",
  "waste_types": ["plastic", "organic", ...],
  "summary_hi": "one line summary of the dump in Hindi",
  "complaint_text": "short formal complaint in English for the municipal corporation requesting clearance"
}`;

    const response = await callGemini([
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
        ],
      },
    ]);

    const aiResult = JSON.parse(response.text);

    // If not a dump, return message without saving
    if (!aiResult.is_dump) {
      return res.json({
        is_dump: false,
        message: 'This does not look like a waste dump.',
        aiResult: aiResult,
      });
    }

    // Prepare report record
    const newReport = {
      id: Date.now().toString(),
      time: new Date().toISOString(),
      lat: lat,
      lng: lng,
      note: note,
      aiResult: aiResult,
    };

    // Save into reports.json
    const reports = getReports();
    reports.unshift(newReport); // newest first
    saveReports(reports);

    res.json({
      is_dump: true,
      report: newReport,
    });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: error.message || 'Something went wrong' });
  }
});

// GET /reports: Return all saved reports
app.get('/reports', (req, res) => {
  const reports = getReports();
  res.json(reports);
});

// Friendly error handling middleware for file uploads
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Photo ka size 5 MB se zyada hai. Kripya choti image chunein.' });
  }
  if (err.message === 'INVALID_IMAGE_FILE') {
    return res.status(400).json({ error: 'Yeh file image nahi hai. Kripya valid photo upload karein.' });
  }
  res.status(500).json({ error: err.message || 'Server error' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
