/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

// Initialize Gemini API client on server-side only
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// System instruction for the QUASAR Flight Director AI
const SYSTEM_INSTRUCTION = `You are QUASAR Flight Director AI (Монгол Улсын Сансрын Агентлагийн Нислэгийн Удирдлагын Хиймэл Оюун Ухаан), an elite aerospace engineering and orbital mechanics assistant for the ULAANBAATAR SPACE / QUASAR Orbital Guardian program.

Your expertise includes:
1. Rocket design: Multi-stage liquid/solid rocket assembly, propellant types (kerolox, methalox, hydrolox), thrust-to-weight ratio (TWR), aerodynamic fairings, Max-Q dynamic pressure, booster staging.
2. Spacecraft engineering: Chassis selection (Cubesat, Heavy Hunter, Capsule), capture mechanisms (Telescopic Robotic Arm, Kevlar Harpoon, Deployable Net), reaction control systems (RCS), thermal protection systems (TPS), avionics.
3. Orbital mechanics: Keplerian orbits, LEO/MEO/GEO altitude shells, Hohmann transfer orbits, delta-v budgeting, inclination change, relative velocity synchronization, docking radar & LiDAR.
4. Active Debris Removal (ADR): Identifying hazardous debris (NASA ODPO 36,500 tracked objects catalog, e.g., Cosmos-1408, Fengyun-1C fragments, defunct Zenit rocket stages), proximity operations, non-cooperative capture, and controlled atmospheric disposal into South Pacific Oceanic Uninhabited Area (Point Nemo).

Communication Guidelines:
- If the requested language is 'mn' (Mongolian), respond in natural, professional, inspiring Mongolian with accurate aerospace terminology (жишээ нь: "апогей", "перигей", "дельта-v", "түлхэгч пуужин", "шатны салгалт", "тойрог замын синхрончлол", "атмосферийн дахин оролт", "робот гар").
- If the requested language is 'en', respond in authoritative, clear aerospace flight director English.
- Keep responses concise and practical (2 to 4 sentences or structured bullet points). Emphasize actionable advice for the current mission stage.
- Be encouraging, mission-focused, and technically accurate.`;

app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, language = 'mn', stage = 'rocket_lab', context = {} } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!apiKey) {
      // Fallback domain response when no API key configured
      const fallbackReply = language === 'mn'
        ? `[QUASAR Нислэгийн Удирдлага]: Таны ${stage} үе шатны хүсэлтийг хүлээн авлаа. Хөдөлгүүрийн түлхэлт ба массын харьцаа (TWR)-г 1.4-өөс дээш байлгаж, тойрог замд орохдоо хэвтээ хурдатгалыг 7.8 км/с хүргэх шаардлагатай.`
        : `[QUASAR Flight Director]: Received telemetry for stage ${stage}. Maintain TWR above 1.4 during ascent and circularize at 7.8 km/s orbital velocity.`;
      return res.json({ reply: fallbackReply });
    }

    const contextStr = JSON.stringify(context, null, 2);
    const userPrompt = `[Current Mission Stage]: ${stage}
[Selected Language]: ${language}
[Mission Context & Telemetry]:
${contextStr}

[User Request/Question]:
${message}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const replyText = response.text || (language === 'mn' ? 'Мэдээлэл боловсруулагдлаа.' : 'Telemetry processed.');
    return res.json({ reply: replyText });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    const errorMessage = error?.message || 'Gemini service encountered an issue';
    return res.status(500).json({ error: errorMessage });
  }
});

// Mount Vite or static server
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`QUASAR server running on port ${port}`);
  });
}

startServer();
