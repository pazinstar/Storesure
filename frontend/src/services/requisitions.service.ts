import axios from 'axios'

const API_PREFIX = '/api/v1/storekeeper/stores'

export async function approveRequisition(requisitionId: string, payload: any) {
  const url = `${API_PREFIX}/requisitions/${requisitionId}/approve/`
  const res = await axios.post(url, payload)
  return res.data
}

export async function fetchRequisition(requisitionId: string) {
  const url = `${API_PREFIX}/s12-requisitions/${requisitionId}/`
  const res = await axios.get(url)
  return res.data
}

export default {
  approveRequisition,
  fetchRequisition,
}
