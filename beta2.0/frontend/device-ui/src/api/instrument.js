import request from '../utils/request'

export const getList = (query) => request.get('/instruments', { params: query })
export const useDevice = (id, data) => request.post(`/instruments/${id}/use`, data)
export const returnDevice = (id) => request.post(`/instruments/${id}/return`)
export const exportExcel = (query) => request.get('/instruments/export', { params: query, responseType: 'blob' })
export const importExcel = (data) => request.post('/instruments/import', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const createInstrument = (data) => request.post('/instruments', data)
export const updateInstrument = (id, data) => request.put(`/instruments/${id}`, data)
export const updateCalibration = (id, data) => request.put(`/instruments/${id}/calibration`, data)
export const deleteInstrument = (id) => request.delete(`/instruments/${id}`)
