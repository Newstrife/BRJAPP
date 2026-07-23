import request from '../utils/request'

export const getAuditLogs = (query) => request.get('/audit-logs', { params: query })

export const getAuditLogDetail = (id) => request.get(`/audit-logs/${id}`)
