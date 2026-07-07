import request from '../utils/request'

export const getCalibrationRecords = (query) => request.get('/calibration-records', { params: query })

export const createCalibrationRecord = (data) => request.post('/calibration-records', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
})

export const updateCalibrationRecord = (id, data) => request.put(`/calibration-records/${id}`, data, {
  headers: { 'Content-Type': 'multipart/form-data' }
})

export const deleteCalibrationRecord = (id) => request.delete(`/calibration-records/${id}`)
