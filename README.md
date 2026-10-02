# Swachh Saathi 🌿

> **Photo kheencho, kachra sort karo** — An AI-powered civic assistant for waste segregation and open dump reporting under India's Solid Waste Management (SWM) Rules 2026.

---

## 📌 The Problem It Solves

Waste segregation at source remains one of the largest civic challenges in Indian towns and cities. Citizens often struggle to determine whether common household items belong to wet, dry, sanitary, or special care waste categories under the updated **SWM Rules 2026**. Additionally, reporting illegal open garbage piles to municipal corporations is cumbersome. 

**Swachh Saathi** makes waste sorting effortless: click a photo, let Gemini AI instantly classify every item with clear disposal instructions in Hindi, or snap an open garbage dump to auto-generate a geotagged municipal complaint.

---

## ✨ Features

1. **AI Waste Sorting (Sort Kachra)**:
   - Upload or snap a photo of any waste item(s).
   - Gemini Vision categorizes items into the 4 official streams of India's SWM Rules 2026:
     - 🟢 **Wet (Geela)**: Organic & kitchen waste.
     - 🔵 **Dry (Sookha)**: Recyclable paper, plastic, glass, metal.
     - 🔴 **Sanitary**: Tissues, diapers, sanitary pads.
     - 🟠 **Special Care**: Batteries, e-waste, domestic hazardous items.
   - Provides clear, practical one-line tips in Hindi for proper disposal.

2. **Open Dump Reporting (Dump Report)**:
   - Snap a photo of an open garbage dump or overflowing bin.
   - Automatically detects current GPS coordinates (via browser geolocation).
   - AI evaluates if the photo is a real dump site, determines severity level (**Low**, **Medium**, **High**), tags waste types, and writes a Hindi summary.
   - Auto-generates a formal English complaint letter ready to be copied and forwarded to the local Municipal Corporation.

3. **Community Dump Map & History (All Reports)**:
   - Interactive OpenStreetMap (Leaflet) view with pins showing all reported spots.
   - Cards listing past reports with timestamps, severity badges, and landmarks.
   - Helpful empty state when no reports have been filed.

4. **Civic-Friendly UX**:
   - Clean, lightweight green theme designed for mobile and desktop.
   - Hinglish error alerts with instant **"Dobara try karo"** retry buttons.
   - 5 MB file size limit & image type validation.
   - Loading spinners with *"Saathi soch raha hai..."* feedback.

---

## 🔮 Future Scope

- **Integration with Municipal Complaint Portals**: Direct API integration with Swachhata app and local municipal corporation grievance redressal systems.
- **Hindi Voice Input**: Voice-based reporting and query handling in regional Indian languages for enhanced accessibility.
- **Ward-wise Dump Heatmap**: Geo-analytics and heatmaps to identify recurring dumping hotspots and optimize municipal collection routes.

---

## 🛠️ Tech Stack

- **Backend**: Node.js (ES modules), Express, Multer (in-memory buffer parsing)
- **Frontend**: Plain HTML5, CSS3, Vanilla JavaScript (zero UI frameworks)
- **Maps**: Leaflet.js with OpenStreetMap
- **AI / LLM**: Google Gemini API (`@google/genai` using `gemini-flash-latest` with `gemini-3.5-flash` resilient fallback)
- **Storage**: Lightweight file-based JSON storage (`reports.json`)

---

## 🚀 How to Run

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### 2. Setup
Clone the repository and enter the directory:
```bash
git clone https://github.com/praveen4425/swachh-saathi.git
cd swachh-saathi
```

Install dependencies:
```powershell
npm install
```

### 3. Configure API Key
Create a `.env` file in the project root (you can refer to `.env.example`):
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 4. Start the Application
Run:
```powershell
npm start
```
*(or `node server.js`)*

Open your browser and visit:
👉 **http://localhost:3000**

---

## 🤖 AI Tools Attribution
This project was developed with the assistance of:
- **Google Gemini API** (`gemini-flash-latest` / `gemini-3.5-flash`): Powers real-time visual waste classification and civic dump analysis.
- **Antigravity (Google DeepMind)**: Assisted with full-stack architecture, prompt engineering, code generation, and iterative UI polish.

---

## 📄 License
This project is licensed under the [MIT](LICENSE) License.
