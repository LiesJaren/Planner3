export interface GeneratedIconResult {
  label: string;
  emoji: string;
  category: string;
  suggestedColor: string;
  tags: string[];
  reasoning: string;
}

export async function generateIconWithAI(prompt: string): Promise<GeneratedIconResult> {
  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) {
    throw new Error('Voer een activiteit in om een icoon te genereren');
  }

  try {
    const res = await fetch('/api/generate-icon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: cleanPrompt }),
    });

    if (res.ok) {
      const data = await res.json();
      return data as GeneratedIconResult;
    }
  } catch (e) {
    console.warn('API call to /api/generate-icon failed, using fallback:', e);
  }

  // Heuristic offline fallback
  const lower = cleanPrompt.toLowerCase();
  const heuristics: Record<string, GeneratedIconResult> = {
    paard: { label: 'Paardrijden', emoji: '🐴', category: 'sport', suggestedColor: '#d97706', tags: ['Sport', 'Dieren'], reasoning: 'Paardrijden is direct herkenbaar met het paardenhoofd.' },
    judo: { label: 'Judo training', emoji: '🥋', category: 'sport', suggestedColor: '#3b82f6', tags: ['Sport', 'Wekelijks'], reasoning: 'Een judopak en band zijn heel herkenbaar voor kinderen.' },
    gitaar: { label: 'Gitaarles', emoji: '🎸', category: 'muziek', suggestedColor: '#ec4899', tags: ['Muziek', 'Wekelijks'], reasoning: 'Gitaar met vrolijke klanken.' },
    piano: { label: 'Pianoles', emoji: '🎹', category: 'muziek', suggestedColor: '#8b5cf6', tags: ['Muziek', 'Instrument'], reasoning: 'Pianotoetsen spreken jonge kinderen direct aan.' },
    zwem: { label: 'Zwemmen', emoji: '🏊', category: 'zwemmen', suggestedColor: '#0284c7', tags: ['Sport', 'Water'], reasoning: 'Lekker spetteren in het water!' },
    voetbal: { label: 'Voetbal', emoji: '⚽', category: 'sport', suggestedColor: '#10b981', tags: ['Sport', 'Bal'], reasoning: 'Samen scoren op het voetbalveld.' },
    school: { label: 'School', emoji: '🎒', category: 'school', suggestedColor: '#3b82f6', tags: ['Leren', 'Vriendjes'], reasoning: 'Rugzak klaar voor een leuke schooldag.' },
    pannenkoek: { label: 'Pannenkoeken bakken', emoji: '🥞', category: 'eten', suggestedColor: '#f59e0b', tags: ['Eten', 'Gezellig'], reasoning: 'Heerlijke stapel pannenkoeken.' },
    pizza: { label: 'Zelf pizza maken', emoji: '🍕', category: 'eten', suggestedColor: '#ef4444', tags: ['Eten', 'Koken'], reasoning: 'Iedereen zijn eigen favoriete pizza beleggen.' },
  };

  for (const [key, val] of Object.entries(heuristics)) {
    if (lower.includes(key)) {
      return val;
    }
  }

  return {
    label: cleanPrompt.charAt(0).toUpperCase() + cleanPrompt.slice(1),
    emoji: '🌟',
    category: 'club',
    suggestedColor: '#f59e0b',
    tags: ['Activiteit', 'Gezin'],
    reasoning: 'Een gouden ster maakt elke speciale activiteit feestelijk en herkenbaar!',
  };
}
