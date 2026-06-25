import request from '../utils/request'

export const getWecomSetting = () => request.get('/wecom/setting')
export const saveWecomSetting = (data) => request.post('/wecom/setting', data)
export const testWecom = (data) => request.post('/wecom/test', data)
