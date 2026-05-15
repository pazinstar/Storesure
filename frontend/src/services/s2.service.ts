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

export async function getS2Ledger(params?: Record<string, any>) {
  const q = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(`${PREFIX}/s2/ledger/${q}`);
  return handleResponse(res);
}

export async function postS2Receipt(payload: any) {
  const res = await fetch(`${PREFIX}/s2/receipt/`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)});
  return handleResponse(res);
}

export async function postS2Issue(payload: any) {
  const res = await fetch(`${PREFIX}/s2/issue/`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)});
  return handleResponse(res);
}

export async function postS2Transfer(payload: any) {
  const res = await fetch(`${PREFIX}/s2/transfer/`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)});
  return handleResponse(res);
}

export async function postS2Return(payload: any) {
  const res = await fetch(`${PREFIX}/s2/return/`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)});
  return handleResponse(res);
}

export async function postS2Damage(payload: any) {
  const res = await fetch(`${PREFIX}/s2/damage/`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)});
  return handleResponse(res);
}

export default {
  getS2Ledger,
  postS2Receipt,
  postS2Issue,
  postS2Transfer,
  postS2Return,
  postS2Damage,
}
