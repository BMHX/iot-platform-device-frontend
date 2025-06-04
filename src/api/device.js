import request from './request';

/**
 * 根据管理员ID获取设备列表
 * @param {number} adminId 管理员ID
 * @returns {Promise<Array>} 设备列表
 */
export function listDevicesByAdminId(adminId) {
  return request({
    url: `/api/device/admin/${adminId}`,
    method: 'get'
  });
}

/**
 * 分页查询设备列表
 * @param {Object} query 查询参数
 * @returns {Promise<Object>} 分页结果
 */
export function pageDevices(query) {
  return request({
    url: '/api/device/page',
    method: 'get',
    params: query
  });
}

/**
 * 根据ID获取设备信息
 * @param {number} id 设备ID
 * @returns {Promise<Object>} 设备信息
 */
export function getById(id) {
  return request({
    url: `/api/device/${id}`,
    method: 'get'
  });
}

/**
 * 新增设备
 * @param {Object} data 设备数据
 * @returns {Promise<string>} 结果
 */
export function addDevice(data) {
  return request({
    url: '/api/device',
    method: 'post',
    data
  });
}

/**
 * 更新设备
 * @param {Object} data 设备数据
 * @returns {Promise<string>} 结果
 */
export function updateDevice(data) {
  return request({
    url: '/api/device',
    method: 'put',
    data
  });
}

/**
 * 删除设备
 * @param {number} id 设备ID
 * @returns {Promise<string>} 结果
 */
export function deleteDevice(id) {
  return request({
    url: `/api/device/${id}`,
    method: 'delete'
  });
}

/**
 * 更新设备集成状态
 * @param {number} id 设备ID
 * @param {number} integrationValue 集成状态值
 * @returns {Promise<string>} 结果
 */
export function updateDeviceIntegration(id, integrationValue) {
  return request({
    url: `/api/device/integration/${id}/${integrationValue}`,
    method: 'put'
  });
} 