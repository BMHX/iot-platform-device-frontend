import axios from 'axios';
import { ElMessage } from 'element-plus';

// 创建axios实例
const service = axios.create({
  baseURL: 'http://localhost:8087', // 修改为正确的后端地址
  timeout: 15000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 从localStorage获取token
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers['Authorization'] = `Bearer ${token}`;
    // }
    
    console.log('请求URL:', config.url);
    console.log('请求方法:', config.method);
    console.log('请求参数:', config.params || config.data);
    return config;
  },
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  response => {
    console.log('响应数据:', response.data);
    const res = response.data;
    
    // 如果返回的状态码不是0，说明接口请求有误
    if (res.code !== 0 && res.code !== undefined) {
      ElMessage({
        message: res.msg || '请求失败',
        type: 'error',
        duration: 5 * 1000
      });
      
      // 401: 未登录或token过期
      // if (res.code === 401) {
      //   // 清除用户信息
      //   localStorage.removeItem('token');
      //   localStorage.removeItem('isAuthenticated');
      //   localStorage.removeItem('adminId');
      //   localStorage.removeItem('username');
        
      //   // 跳转到登录页
      //   window.location.href = '/login';
      // }
      return Promise.reject(new Error(res.msg || '请求失败'));
    }
    
    return res;
  },
  error => {
    console.error('响应错误:', error);
    
    // 打印更多错误信息
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应头:', error.response.headers);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      console.error('请求已发送但未收到响应');
      console.error(error.request);
    } else {
      console.error('请求配置错误:', error.message);
    }
    
    let message = error.message;
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '未授权，请重新登录';
          // 清除用户信息
          // localStorage.removeItem('token');
          // localStorage.removeItem('isAuthenticated');
          // localStorage.removeItem('adminId');
          // localStorage.removeItem('username');
          // 跳转到登录页
          // window.location.href = '/login';
          break;
        case 404:
          message = '请求的资源不存在';
          break;
        case 500:
          message = '服务器内部错误';
          if (error.response.data && error.response.data.msg) {
            message += `: ${error.response.data.msg}`;
          }
          break;
        default:
          message = `请求错误: ${error.response.status}`;
      }
    }
    ElMessage.error(message);
    return Promise.reject(error);
  }
);

export default service; 