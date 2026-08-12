import request from '../utils/request'

export const getFieldConfig = () => request.get('/field-config/instrument')
export const saveFieldConfig = (required, reminderDays) =>
  request.put('/field-config/instrument', { required, reminder_days: reminderDays })
