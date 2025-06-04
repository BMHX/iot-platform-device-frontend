import request from './request';

/**
 * 新增设备协议绑定
 * @param {Object} data 绑定数据
 * @param {number} data.deviceId 设备ID
 * @param {number} data.protocolId 协议ID
 * @param {string} data.bindTime 绑定时间，格式：YYYY-MM-DD HH:mm:ss
 * @returns {Promise<string>} 结果
 */
export function addDeviceProtocol(data) {
  return request({
    url: '/api/device-protocol',
    method: 'post',
    data
  });
}

/**
 * 根据ID修改设备ID
 * @param {number} id 绑定ID
 * @param {number} deviceId 设备ID
 * @returns {Promise<string>} 结果
 */
export function updateDeviceId(id, deviceId) {
  return request({
    url: `/api/device-protocol/device/${id}/${deviceId}`,
    method: 'put'
  });
}

/**
 * 根据ID修改协议ID
 * @param {number} id 绑定ID
 * @param {number} protocolId 协议ID
 * @returns {Promise<string>} 结果
 */
export function updateProtocolId(id, protocolId) {
  return request({
    url: `/api/device-protocol/protocol/${id}/${protocolId}`,
    method: 'put'
  });
}

/**
 * 根据设备ID删除绑定
 * @param {number} deviceId 设备ID
 * @returns {Promise<string>} 结果
 */
export function deleteByDeviceId(deviceId) {
  return request({
    url: `/api/device-protocol/device/${deviceId}`,
    method: 'delete'
  });
}

/**
 * 根据协议ID删除绑定
 * @param {number} protocolId 协议ID
 * @returns {Promise<string>} 结果
 */
export function deleteByProtocolId(protocolId) {
  return request({
    url: `/api/device-protocol/protocol/${protocolId}`,
    method: 'delete'
  });
}

/**
 * 查询所有设备协议绑定
 * @returns {Promise<Array>} 绑定列表
 */
export function listAllDeviceProtocols() {
  return request({
    url: '/api/device-protocol/list',
    method: 'get'
  });
}

/**
 * 根据设备ID查询绑定
 * @param {number} deviceId 设备ID
 * @returns {Promise<Array>} 绑定列表
 */
export function listByDeviceId(deviceId) {
  return request({
    url: `/api/device-protocol/list/device/${deviceId}`,
    method: 'get'
  });
}

/**
 * 根据协议ID查询绑定
 * @param {number} protocolId 协议ID
 * @returns {Promise<Array>} 绑定列表
 */
export function listByProtocolId(protocolId) {
  return request({
    url: `/api/device-protocol/list/protocol/${protocolId}`,
    method: 'get'
  });
}

/**
 * 根据ID获取设备协议绑定信息
 * @param {number} id 绑定ID
 * @returns {Promise<Object>} 绑定信息
 */
export function getDeviceProtocolById(id) {
  return request({
    url: `/api/device-protocol/${id}`,
    method: 'get'
  });
} 