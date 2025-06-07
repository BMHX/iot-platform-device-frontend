import request from './request'

// 新闻相关接口
export function getNewsList(params) {
  return request({
    url: '/api/news',
    method: 'get',
    params
  })
}

export function getNewsById(id) {
  return request({
    url: `/api/news/${id}`,
    method: 'get'
  })
}

export function createNews(data) {
  return request({
    url: '/api/news',
    method: 'post',
    data
  })
}

export function updateNews(id, data) {
  return request({
    url: `/api/news/${id}`,
    method: 'put',
    data
  })
}

export function deleteNews(id) {
  return request({
    url: `/api/news/${id}`,
    method: 'delete'
  })
}

// 新闻来源相关接口
export function getNewsSourceList(params) {
  return request({
    url: '/api/news-sources',
    method: 'get',
    params
  })
}

export function getNewsSourceById(id) {
  return request({
    url: `/api/news-sources/${id}`,
    method: 'get'
  })
}

export function createNewsSource(data) {
  return request({
    url: '/api/news-sources',
    method: 'post',
    data
  })
}

export function updateNewsSource(id, data) {
  return request({
    url: `/api/news-sources/${id}`,
    method: 'put',
    data
  })
}

export function deleteNewsSource(id) {
  return request({
    url: `/api/news-sources/${id}`,
    method: 'delete'
  })
} 