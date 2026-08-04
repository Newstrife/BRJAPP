import request from '../utils/request'

export const getVerificationRecords = (query) => request.get('/verification-records', { params: query })

export const createVerificationRecord = (data) => request.post('/verification-records', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
})

export const updateVerificationRecord = (id, data) => request.put(`/verification-records/${id}`, data, {
  headers: { 'Content-Type': 'multipart/form-data' }
})

export const deleteVerificationRecord = (id) => request.delete(`/verification-records/${id}`)
