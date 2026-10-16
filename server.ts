import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Google Gemini API server-side client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback heuristic database for popular Dutch family activities
const LOCAL_ICON_SUGGESTIONS: Record<string, { label: string; emoji: string; category: string; suggestedColor: string; tags: string[]; reasoning: string }> = {
  paard: { label: 'Paardrijden', emoji: '🐴', category: 'sport', suggestedColor: '#d97706', tags: ['Sport', 'Dieren'], reasoning: 'Paardrijden en manege zijn direct herkenbaar met het paardenhoofd.' },
  judo: { label: 'Judo training', emoji: '🥋', category: 'sport', suggestedColor: '#3b82f6', tags: ['Sport', 'Wekelijks'], reasoning: 'Een judopak en band zijn heel herkenbaar voor kinderen.' },
  karate: { label: 'Karate', emoji: '🥋', category: 'sport', suggestedColor: '#ef4444', tags: ['Sport'], reasoning: 'Vechtsport icoon in actieve kleur.' },
  gitaar: { label: 'Gitaarles', emoji: '🎸', category: 'muziek', suggestedColor: '#ec4899', tags: ['Muziek', 'Wekelijks'], reasoning: 'Gitaar met vrolijke klanken.' },
  piano: { label: 'Pianoles', emoji: '🎹', category: 'muziek', suggestedColor: '#8b5cf6', tags: ['Muziek', 'Instrument'], reasoning: 'Pianotoetsen spreken jonge kinderen direct aan.' },
  drum: { label: 'Drumles', emoji: '🥁', category: 'muziek', suggestedColor: '#f97316', tags: ['Muziek', 'Ritme'], reasoning: 'Trommels zijn heel energiek en leuk!' },
  scouting: { label: 'Scouting / Chiro', emoji: '🏕️', category: 'club', suggestedColor: '#059669', tags: ['Buiten', 'Club'], reasoning: 'Tenten en avontuur in het bos.' },
  strand: { label: 'Strand & Zee', emoji: '🏖️', category: 'buiten', suggestedColor: '#0284c7', tags: ['Buiten', 'Water'], reasoning: 'Zon en strand met zandkastelen.' },
  dierentuin: { label: 'Dierentuin', emoji: '🦁', category: 'feest', suggestedColor: '#eab308', tags: ['Uitje', 'Dieren'], reasoning: 'Wilde dieren bekijken is een echt feestje!' },
  kermis: { label: 'Kermis', emoji: '🎡', category: 'feest', suggestedColor: '#ec4899', tags: ['Feest', 'Spannend'], reasoning: 'Reuzenrad en attracties.' },
  trampoline: { label: 'Trampolinepark', emoji: '🤸', category: 'club', suggestedColor: '#f59e0b', tags: ['Sport', 'Springen'], reasoning: 'Lekker springen en bewegen!' },
  pannenkoek: { label: 'Pannenkoeken bakken', emoji: '🥞', category: 'eten', suggestedColor: '#f59e0b', tags: ['Eten', 'Gezellig'], reasoning: 'Stapel pannenkoeken met stroop en suiker.' },
  pizza: { label: 'Zelf pizza maken', emoji: '🍕', category: 'eten', suggestedColor: '#ef4444', tags: ['Eten', 'Koken'], reasoning: 'Iedereen zijn eigen favoriete pizza beleggen.' },
  lego: { label: 'Lego bouwen', emoji: '🧱', category: 'creatief', suggestedColor: '#ef4444', tags: ['Knutselen', 'Bouwen'], reasoning: 'Kleurrijke bouwsteentjes.' },
};

// POST /api/generate-icon: Generate child-friendly activity icon using Gemini
app.post('/api/generate-icon', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is verplicht' });
    }

    const cleanPrompt = prompt.trim();

    // If Gemini client is initialized, use gemini-3.8-flash for rich structured JSON
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `De gebruiker wil een nieuw kindvriendelijk icoon toevoegen aan een Nederlandse familie weekplanner voor kinderen van 6 jaar en ouders.
Activiteitomschrijving: "${cleanPrompt}".

Bedenk:
1. label: Korte, vrolijke en heldere titel in het Nederlands (max 3-4 woorden).
2. emoji: 1 enkel zeer herkenbaar emoji icoon dat perfect past bij deze activiteit (bijv. ⚽, 🎸, 🐴, 🥋, 🥞, 🏕️, 🎨).
3. category: Kies de best passende categorie uit: ["sport", "school", "eten", "muziek", "creatief", "club", "zwemmen", "dieren", "feest", "zorg", "buiten", "techniek", "huishoud", "vakantie", "dagelijks"].
4. suggestedColor: Een vrolijke hex kleur die goed past (bijv. #3b82f6 voor blauw/sport, #ec4899 voor roze/dans, #10b981 voor groen/buiten, #f59e0b voor geel/zon, #8b5cf6 voor paars/creatief).
5. tags: 2 tot 3 korte labels/tags in het Nederlands (bijv. ["Sport", "Wekelijks"], ["Muziek", "Les"], ["Gezellig", "Weekend"]).
6. reasoning: Een korte, bemoedigende zin in het Nederlands (1 zin) waarom dit icoon handig en leuk is voor een 6-jarige.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                emoji: { type: Type.STRING },
                category: { type: Type.STRING },
                suggestedColor: { type: Type.STRING },
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                reasoning: { type: Type.STRING },
              },
              required: ['label', 'emoji', 'category', 'suggestedColor', 'tags', 'reasoning'],
            },
          },
        });

        const text = response.text?.trim();
        if (text) {
          const parsed = JSON.parse(text);
          return res.json(parsed);
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to heuristic matching:', geminiError);
      }
    }

    // Heuristic Fallback if Gemini is unavailable or errors
    const lower = cleanPrompt.toLowerCase();
    for (const [key, val] of Object.entries(LOCAL_ICON_SUGGESTIONS)) {
      if (lower.includes(key)) {
        return res.json(val);
      }
    }

    // Generic friendly fallback
    return res.json({
      label: cleanPrompt.charAt(0).toUpperCase() + cleanPrompt.slice(1),
      emoji: '🌟',
      category: 'club',
      suggestedColor: '#f59e0b',
      tags: ['Activiteit', 'Gezin'],
      reasoning: 'Een gouden ster maakt elke speciale activiteit feestelijk en herkenbaar!',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.error('Error generating icon:', message);
    return res.status(500).json({ error: 'Kon icoon niet genereren' });
  }
});

// Mount Vite in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const listenPort = Number(PORT) || 3000;
  app.listen(listenPort, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${listenPort}`);
  });
}

startServer();
