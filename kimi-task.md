# 设备管理系统 · 新功能开发任务（4 项）

项目位置：`E:\BRJAPP\beta2.0`（backend 为 Express + Sequelize/MySQL，frontend/device-ui 为 Vue 3 + Element Plus）。
现有代码风格：枚举字段存英文 key，前端做中文映射；接口统一 `{code,message,data}`；写操作要记审计日志（services/auditService）。
完成后要求：后端 `node --check` 全部通过；前端 `npm run build` 通过。不要执行 git 提交。

---

## 任务 1：新增"校准方式"与"验证情况"，计量状态更名并联动

### 1.1 新增字段 `calibration_mode`（仪器设备校准方式）
- 选择框，可选值：`计量`（calibration，默认）、`计量+验证`（calibration_verification）。
- 存英文 key，前端映射中文。

### 1.2 新增字段 `verification_result`（验证情况）
- 选择框，可选值：`未验证`（unverified，默认）、`合格`（passed）、`不合格`（failed）。
- 注：需求原文未给选项，按以上三个实现。

### 1.3 新增字段 `next_verification_date`（下次验证日期，DATEONLY）
- 用于任务 4 的到期推送。

### 1.4 字段更名
- 现有 `calibration_status`（计量状态）在所有界面上的显示名称改为 **计量/验证状态**，枚举值不变
  （uncalibrated/normal/due_soon/expired/failed）。

### 1.5 联动逻辑
- 校准方式为 `计量` 时：维持现有逻辑（计量结果不合格 → calibration_status=failed + 锁定）。
- 校准方式为 `计量+验证` 时：计量结果与验证情况**任一不合格** → calibration_status=failed、锁定、锁定原因写明（如"验证不合格"）；均合格 → normal。

---

## 任务 2：设备状态改为（正常、维修、暂停、报废）

- 复用现有 `status` 字段，枚举改为：正常（normal，默认）、维修（repair）、暂停（paused）、报废（scrapped）。
- 启动时数据迁移：旧值 `idle`、`in_use` → `normal`；`repair` 不变；`scrapped` 不变。
- 更新所有涉及该字段的地方：新增/编辑表单（前端 InstrumentForm.vue 和 InstrumentList.vue 编辑弹窗中的"使用状态"选择框）、详情页、移动端状态标签（mobile 目前只在 repair/scrapped 时显示标签，改为 repair/paused/scrapped 时显示，并更新文案映射）、utils/format.js 的 deviceStatusText/deviceStatusTag。
- 后端 buildInstrumentPayload、列表筛选（如按 status 筛选）同步更新可选值。

---

## 任务 3：企业微信推送内容包含设备名称、设备编号、计量到期日期

- 修改 backend/jobs/scheduler.js 的到期提醒消息格式，例如：
  `【计量到期提醒】设备名称：XXX，设备编号：XXX，计量到期日期：YYYY-MM-DD，剩余 X 天，请及时安排计量。`
- 保留现有的"每台设备每个日期只提醒一次"的去重机制（calibration_reminder_for_date）。

---

## 任务 4：同时推送验证到期日期

- 仅对校准方式为 `计量+验证` 且填写了 `next_verification_date` 的设备生效。
- 与计量到期同规则：提前 10 天开始推送、超期后按过期处理、每台设备每个日期只提醒一次（新增 `verification_reminder_for_date` 字段去重）。
- 消息格式示例：
  `【验证到期提醒】设备名称：XXX，设备编号：XXX，验证到期日期：YYYY-MM-DD，剩余 X 天，请及时安排验证。`

---

## 需要同步更新的地方（检查清单）

1. `backend/models/instrument.js`：新增 calibration_mode / verification_result / next_verification_date / verification_reminder_for_date；status 枚举改值。
2. `backend/app.js`：启动时旧 status 值迁移（idle/in_use → normal）。
3. `backend/controllers/instrumentController.js`：buildInstrumentPayload 加新字段；updateCalibration 加联动逻辑。
4. `backend/controllers/calibrationRecordController.js`：创建/更新计量记录时的设备状态联动同样考虑验证情况。
5. `backend/jobs/scheduler.js`：消息格式 + 验证到期检查。
6. `backend/services/excelService.js`：fieldMap 增加 校准方式/验证情况/下次验证日期（导入导出兼容）。
7. 前端表单与详情：InstrumentForm.vue（新增设备）、InstrumentList.vue（编辑弹窗 + 详情弹窗）、设备列表"计量状态"列和筛选下拉的显示文案改为"计量/验证状态"。
8. `frontend/src/utils/format.js`：新增字段的中文映射；deviceStatusText/Tag 改值；calibrationText 相关文案同步。
9. 移动端：MobileInstrumentDetail.vue（详情显示新字段）、MobileInstrumentList.vue（状态标签逻辑）、MobileDashboard.vue 如有涉及。
10. 审计日志埋点沿用现有方式（create/update 的 detail 快照自动包含新字段，无需额外处理）。
