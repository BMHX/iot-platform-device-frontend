import request from './request';

/**
 * 获取所有协议列表（不分页）
 * @returns {Promise<Array>} 协议列表
 */
export function getProtocolList() {
  return request({
    url: '/iot/protocol/list',
    method: 'get',
    params: {
      page: 1,
      limit: 100  // 设置一个较大的值，相当于不分页
    }
  });
}

/**
 * 根据ID获取协议信息
 * @param {number} id 协议ID
 * @returns {Promise<Object>} 协议信息
 */
export function getProtocolById(id) {
  return request({
    url: `/iot/protocol/${id}`,
    method: 'get'
  });
}

/**
 * 新增协议
 * @param {Object} data 协议数据
 * @returns {Promise<string>} 结果
 */
export function addProtocol(data) {
  return request({
    url: '/iot/protocol',
    method: 'post',
    data
  });
}

/**
 * 更新协议
 * @param {Object} data 协议数据
 * @returns {Promise<string>} 结果
 */
export function updateProtocol(data) {
  return request({
    url: '/iot/protocol',
    method: 'put',
    data
  });
}

/**
 * 删除协议
 * @param {number} id 协议ID
 * @returns {Promise<string>} 结果
 */
export function deleteProtocol(id) {
  return request({
    url: `/iot/protocol/${id}`,
    method: 'delete'
  });
} 