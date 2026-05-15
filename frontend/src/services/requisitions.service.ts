const API_PREFIX = '/api/v1/storekeeper/stores'

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

export async function approveRequisition(requisitionId: string, payload: any) {
  const url = `${API_PREFIX}/requisitions/${requisitionId}/approve/`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function fetchRequisition(requisitionId: string) {
  const url = `${API_PREFIX}/s12-requisitions/${requisitionId}/`;
  const res = await fetch(url);
  return handleResponse(res);
}

export async function generateSIV(requisitionId: string) {
  const url = `${API_PREFIX}/requisitions/${requisitionId}/generate_siv/`;
  const res = await fetch(url, { method: 'POST' });
  const data = await handleResponse(res);
  // backend returns { ok: True, s13: <id> } — normalize to s13Id for client convenience
  return { ok: data?.ok === true, s13Id: data?.s13 ?? data?.s13Id ?? null, raw: data };
}

export default {
  approveRequisition,
  fetchRequisition,
  generateSIV,
}
