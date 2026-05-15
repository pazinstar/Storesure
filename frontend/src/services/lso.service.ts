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

export async function createLso(payload: any) {
  const res = await fetch(`${PREFIX}/lsos/`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  return handleResponse(res);
}

export async function updateLso(id: string, payload: any) {
  const res = await fetch(`${PREFIX}/lsos/${id}/`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  return handleResponse(res);
}

export async function getLso(id: string) {
  const res = await fetch(`${PREFIX}/lsos/${id}/`);
  return handleResponse(res);
}

export async function verifyLso(id: string, payload: any) {
  const res = await fetch(`${PREFIX}/lsos/${id}/verify/`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  return handleResponse(res);
}

export async function getLsoPrintHtml(id: string) {
  const res = await fetch(`${PREFIX}/lsos/${id}/print-html/`);
  return handleResponse(res);
}

export default { createLso, updateLso, getLso, verifyLso, getLsoPrintHtml };
