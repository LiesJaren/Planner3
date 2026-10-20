interface PlannerRequest {
  method?: string;
  body?: unknown;
  query?: Record<string, unknown>;
}

interface PlannerResponse {
  setHeader(name: string, value: string): void;
  status(code: number): PlannerResponse;
  json(body: unknown): void;
}

const saveScript = `
local current = redis.call('GET', KEYS[1])
local currentRevision = 0
if current then currentRevision = cjson.decode(current).revision end
if currentRevision ~= tonumber(ARGV[1]) then
  return {'conflict', tostring(currentRevision), current or ''}
end
local nextData = cjson.decode(ARGV[2])
nextData.revision = currentRevision + 1
local encoded = cjson.encode(nextData)
redis.call('SET', KEYS[1], encoded)
return {'saved', tostring(nextData.revision), encoded}
`;

function hasPlannerData(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const data = value as Record<string, unknown>;
  const hasArrays = ['members', 'events', 'groceries', 'rewards', 'customIcons', 'customCategories']
    .every((key) => Array.isArray((value as Record<string, unknown>)[key]));
  if (!hasArrays || data.preferences === undefined) return hasArrays;
  if (typeof data.preferences !== 'object' || data.preferences === null) return false;
  const preferences = data.preferences as Record<string, unknown>;
  return (preferences.iconRows === 2 || preferences.iconRows === 3)
    && typeof preferences.defaultIconOnlyView === 'boolean'
    && typeof preferences.showKidsTab === 'boolean'
    && typeof preferences.showGroceriesTab === 'boolean';
}

async function runRedisCommand(command: unknown[]): Promise<unknown> {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Vercel KV of Upstash Redis REST-gegevens moeten zijn ingesteld');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error(`Planneropslag antwoordde met HTTP ${response.status}`);

  const result: unknown = await response.json();
  if (typeof result !== 'object' || result === null || !('result' in result)) {
    throw new Error('Ongeldig antwoord van de planneropslag');
  }
  if ('error' in result && result.error) throw new Error(String(result.error));
  return result.result;
}

function parseStoredData(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'string' || !value) return null;
  const parsed: unknown = JSON.parse(value);
  if (!hasPlannerData(parsed) || !Number.isInteger(parsed.revision)) {
    throw new Error('Ongeldige opgeslagen plannergegevens');
  }
  return parsed;
}

export async function plannerHandler(req: PlannerRequest, res: PlannerResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const plannerId = req.query?.planner;
    if (typeof plannerId !== 'string' || !/^[0-9a-f-]{36}$/i.test(plannerId)) {
      res.status(400).json({ error: 'Ongeldige plannerlink' });
      return;
    }
    const plannerKey = `familieplanner:${plannerId}`;

    if (req.method === 'GET') {
      const storedData = parseStoredData(await runRedisCommand(['GET', plannerKey]));
      res.status(200).json({
        data: storedData,
        revision: typeof storedData?.revision === 'number' ? storedData.revision : 0,
      });
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Methode niet toegestaan' });
      return;
    }

    const body = req.body;
    if (typeof body !== 'object' || body === null || !('data' in body) || !hasPlannerData(body.data)) {
      res.status(400).json({ error: 'Ongeldige plannergegevens' });
      return;
    }
    if (!('expectedRevision' in body) || !Number.isInteger(body.expectedRevision) || Number(body.expectedRevision) < 0) {
      res.status(400).json({ error: 'Ongeldig versienummer' });
      return;
    }

    const result = await runRedisCommand([
      'EVAL',
      saveScript,
      '1',
      plannerKey,
      String(body.expectedRevision),
      JSON.stringify(body.data),
    ]);
    if (!Array.isArray(result) || result.length < 3) {
      throw new Error('Ongeldig opslagresultaat');
    }
    const storedData = parseStoredData(result[2]);
    if (!storedData) throw new Error('Plannergegevens ontbreken na opslaan');

    if (result[0] === 'conflict') {
      res.status(409).json({ data: storedData, revision: storedData.revision });
      return;
    }
    if (result[0] !== 'saved') throw new Error('Plannergegevens konden niet worden opgeslagen');
    res.status(200).json({ data: storedData, revision: storedData.revision });
  } catch (error) {
    console.error('Planneropslagfout:', error);
    const message = error instanceof Error ? error.message : 'Onbekende opslagfout';
    const status = message.includes('moeten zijn ingesteld') ? 503 : 500;
    res.status(status).json({ error: message });
  }
}
