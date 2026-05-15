import { apiConfig } from './config';

const PREFIX = `${apiConfig.baseUrl}${apiConfig.storekeeperRoute}`;

async function handleResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    let data: any = text;
    try { data = JSON.parse(text); } catch(e) {}
    const err: any = new Error('Request failed');
    err.response = { status: res.status, data };
    throw err;
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

export async function classifyItem(payload: any) {
  const res = await fetch(`${PREFIX}/capitalization/classify/`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  return handleResponse(res);
}

export async function overrideDecision(payload: any) {
  const res = await fetch(`${PREFIX}/capitalization/override/`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  return handleResponse(res);
}

export async function getPendingPrompts() {
  const res = await fetch(`${PREFIX}/capitalization/prompts/pending/`);
  return handleResponse(res);
}

export default { classifyItem, overrideDecision, getPendingPrompts };
