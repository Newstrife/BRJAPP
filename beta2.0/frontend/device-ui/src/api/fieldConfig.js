import request from '../utils/request'

export const getFieldConfig = () => request.get('/field-config/instrument')
export const saveFieldConfig = (required) => request.put('/field-config/instrument', { required })
