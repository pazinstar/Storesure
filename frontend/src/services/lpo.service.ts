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

export async function createLpo(payload: any) {
  const res = await fetch(`${PREFIX}/lpos/`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  return handleResponse(res);
}

export async function updateLpo(id: string, payload: any) {
  const res = await fetch(`${PREFIX}/lpos/${id}/`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  return handleResponse(res);
}

export async function getLpo(id: string) {
  const res = await fetch(`${PREFIX}/lpos/${id}/`);
  return handleResponse(res);
}

export async function sendLpo(id: string) {
  const res = await fetch(`${PREFIX}/lpos/${id}/send/`, { method: 'POST' });
  return handleResponse(res);
}

export async function getLpoPrintHtml(id: string) {
  const res = await fetch(`${PREFIX}/lpos/${id}/print-html/`);
  return handleResponse(res);
}

export default { createLpo, updateLpo, getLpo, sendLpo, getLpoPrintHtml };
