import axios from 'axios';

/**
 * 根据经纬度获取地理位置信息（使用高德地图API）
 * @param {string} longitude 经度
 * @param {string} latitude 纬度
 * @returns {Promise<Object>} 地理位置信息
 */
export async function getLocationByCoordinates(longitude, latitude) {
  // 高德地图API的Key
  const apiKey = '1d109d068afa9c4a891bed0a7aebdcb0'; // 使用与地图相同的Key
  
  try {
    // 确保经纬度是有效的数字
    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);
    
    if (isNaN(lng) || isNaN(lat)) {
      console.error('无效的经纬度:', longitude, latitude);
      return null;
    }
    
    // 使用高德地图逆地理编码API
    const url = `https://restapi.amap.com/v3/geocode/regeo?key=${apiKey}&location=${lng},${lat}&extensions=base`;
    console.log('请求高德地图API:', url);
    
    const response = await axios.get(url);
    console.log('高德地图API响应:', response.data);
    
    if (response.data.status === '1' && response.data.regeocode) {
      const result = response.data.regeocode;
      const addressComponent = result.addressComponent || {};
      
      // 确保所有字段都有默认值
      return {
        province: addressComponent.province || '未知省份',
        city: addressComponent.city || addressComponent.province || '未知城市',
        district: addressComponent.district || '未知区县',
        township: addressComponent.township || '',
        formatted_address: result.formatted_address || '未知地址'
      };
    } else {
      console.error('地理编码API请求失败:', response.data.info || '未知错误');
      return null;
    }
  } catch (error) {
    console.error('获取地理位置信息失败:', error);
    return null;
  }
}

/**
 * 使用高德地图Web API获取地理位置信息（作为备用方案）
 * @param {string} longitude 经度
 * @param {string} latitude 纬度
 * @returns {Promise<Object>} 地理位置信息
 */
export async function getLocationByWebAPI(longitude, latitude) {
  return new Promise((resolve) => {
    if (window.AMap && window.AMap.Geocoder) {
      try {
        const geocoder = new window.AMap.Geocoder();
        const lnglat = [parseFloat(longitude), parseFloat(latitude)];
        
        geocoder.getAddress(lnglat, (status, result) => {
          if (status === 'complete' && result.regeocode) {
            const address = result.regeocode.addressComponent;
            resolve({
              province: address.province || '未知省份',
              city: address.city || address.province || '未知城市',
              district: address.district || '未知区县',
              township: address.township || '',
              formatted_address: result.regeocode.formattedAddress || '未知地址'
            });
          } else {
            console.error('高德地图Web API逆地理编码失败:', status);
            resolve(null);
          }
        });
      } catch (error) {
        console.error('高德地图Web API调用失败:', error);
        resolve(null);
      }
    } else {
      console.error('高德地图Web API不可用');
      resolve(null);
    }
  });
}

/**
 * 使用离线方式根据经纬度获取地理位置信息（模拟，不依赖外部API）
 * 这是一个简化版，仅支持少量预设的经纬度范围
 * @param {string} longitude 经度
 * @param {string} latitude 纬度
 * @returns {Promise<Object>} 地理位置信息
 */
export async function getLocationOffline(longitude, latitude) {
  // 将字符串转为数字
  const lng = parseFloat(longitude);
  const lat = parseFloat(latitude);
  
  // 预设的经纬度范围映射表（简化版）
  const locationMap = [
    {
      range: { minLng: 116.2, maxLng: 116.5, minLat: 39.8, maxLat: 40.0 },
      location: { province: '北京市', city: '北京市', district: '海淀区' }
    },
    {
      range: { minLng: 116.3, maxLng: 116.6, minLat: 39.8, maxLat: 40.0 },
      location: { province: '北京市', city: '北京市', district: '朝阳区' }
    },
    {
      range: { minLng: 121.3, maxLng: 121.6, minLat: 31.1, maxLat: 31.3 },
      location: { province: '上海市', city: '上海市', district: '浦东新区' }
    },
    {
      range: { minLng: 113.2, maxLng: 113.4, minLat: 23.0, maxLat: 23.2 },
      location: { province: '广东省', city: '广州市', district: '天河区' }
    },
    {
      range: { minLng: 114.0, maxLng: 114.2, minLat: 22.5, maxLat: 22.6 },
      location: { province: '广东省', city: '深圳市', district: '南山区' }
    },
    // 添加南京市的区域
    {
      range: { minLng: 118.7, maxLng: 118.9, minLat: 31.9, maxLat: 32.1 },
      location: { province: '江苏省', city: '南京市', district: '鼓楼区' }
    },
    {
      range: { minLng: 118.7, maxLng: 118.9, minLat: 32.0, maxLat: 32.2 },
      location: { province: '江苏省', city: '南京市', district: '玄武区' }
    },
    {
      range: { minLng: 118.6, maxLng: 118.8, minLat: 31.9, maxLat: 32.1 },
      location: { province: '江苏省', city: '南京市', district: '秦淮区' }
    },
    {
      range: { minLng: 118.7, maxLng: 119.0, minLat: 31.7, maxLat: 31.9 },
      location: { province: '江苏省', city: '南京市', district: '江宁区' }
    },
    {
      range: { minLng: 118.9, maxLng: 119.2, minLat: 31.9, maxLat: 32.2 },
      location: { province: '江苏省', city: '南京市', district: '栖霞区' }
    },
    {
      range: { minLng: 118.5, maxLng: 119.2, minLat: 31.7, maxLat: 32.2 },
      location: { province: '江苏省', city: '南京市', district: '其他区域' }
    }
  ];
  
  // 查找匹配的区域
  for (const item of locationMap) {
    const { range, location } = item;
    if (
      lng >= range.minLng && 
      lng <= range.maxLng && 
      lat >= range.minLat && 
      lat <= range.maxLat
    ) {
      return {
        ...location,
        formatted_address: `${location.province}${location.city}${location.district}`
      };
    }
  }
  
  // 添加一个更宽泛的判断，至少能识别出是哪个城市
  const cityMap = [
    {
      name: '南京市',
      province: '江苏省',
      range: { minLng: 118.3, maxLng: 119.3, minLat: 31.3, maxLat: 32.6 }
    },
    {
      name: '北京市',
      province: '北京市',
      range: { minLng: 115.7, maxLng: 117.4, minLat: 39.4, maxLat: 41.6 }
    },
    {
      name: '上海市',
      province: '上海市',
      range: { minLng: 120.9, maxLng: 122.0, minLat: 30.7, maxLat: 31.9 }
    },
    {
      name: '广州市',
      province: '广东省',
      range: { minLng: 112.9, maxLng: 114.0, minLat: 22.5, maxLat: 23.6 }
    },
    {
      name: '深圳市',
      province: '广东省',
      range: { minLng: 113.8, maxLng: 114.6, minLat: 22.4, maxLat: 22.9 }
    }
  ];
  
  for (const city of cityMap) {
    const { range, name, province } = city;
    if (
      lng >= range.minLng && 
      lng <= range.maxLng && 
      lat >= range.minLat && 
      lat <= range.maxLat
    ) {
      return {
        province: province,
        city: name,
        district: '未知区域',
        formatted_address: `${province}${name}`
      };
    }
  }
  
  // 通过大致范围猜测省份
  const provinceMap = [
    { name: '北京市', range: { minLng: 115.7, maxLng: 117.4, minLat: 39.4, maxLat: 41.6 } },
    { name: '天津市', range: { minLng: 116.7, maxLng: 118.3, minLat: 38.5, maxLat: 40.3 } },
    { name: '河北省', range: { minLng: 113.4, maxLng: 119.8, minLat: 36.0, maxLat: 42.5 } },
    { name: '山西省', range: { minLng: 110.1, maxLng: 114.5, minLat: 34.5, maxLat: 40.7 } },
    { name: '内蒙古自治区', range: { minLng: 97.0, maxLng: 126.0, minLat: 37.4, maxLat: 53.3 } },
    { name: '辽宁省', range: { minLng: 118.8, maxLng: 125.7, minLat: 38.7, maxLat: 43.5 } },
    { name: '吉林省', range: { minLng: 121.6, maxLng: 131.3, minLat: 40.8, maxLat: 46.3 } },
    { name: '黑龙江省', range: { minLng: 121.1, maxLng: 135.1, minLat: 43.5, maxLat: 53.3 } },
    { name: '上海市', range: { minLng: 120.9, maxLng: 122.0, minLat: 30.7, maxLat: 31.9 } },
    { name: '江苏省', range: { minLng: 116.3, maxLng: 121.9, minLat: 30.8, maxLat: 35.1 } },
    { name: '浙江省', range: { minLng: 118.0, maxLng: 122.9, minLat: 27.1, maxLat: 31.1 } },
    { name: '安徽省', range: { minLng: 114.8, maxLng: 119.6, minLat: 29.4, maxLat: 34.6 } },
    { name: '福建省', range: { minLng: 115.8, maxLng: 120.7, minLat: 23.5, maxLat: 28.3 } },
    { name: '江西省', range: { minLng: 113.5, maxLng: 118.4, minLat: 24.5, maxLat: 30.1 } },
    { name: '山东省', range: { minLng: 114.8, maxLng: 122.7, minLat: 34.4, maxLat: 38.4 } },
    { name: '河南省', range: { minLng: 110.2, maxLng: 116.6, minLat: 31.4, maxLat: 36.4 } },
    { name: '湖北省', range: { minLng: 108.4, maxLng: 116.1, minLat: 29.0, maxLat: 33.3 } },
    { name: '湖南省', range: { minLng: 108.8, maxLng: 114.2, minLat: 24.6, maxLat: 30.2 } },
    { name: '广东省', range: { minLng: 109.7, maxLng: 117.3, minLat: 20.2, maxLat: 25.5 } },
    { name: '广西壮族自治区', range: { minLng: 104.5, maxLng: 112.0, minLat: 21.0, maxLat: 26.3 } },
    { name: '海南省', range: { minLng: 108.6, maxLng: 111.0, minLat: 18.1, maxLat: 20.1 } },
    { name: '重庆市', range: { minLng: 105.2, maxLng: 110.1, minLat: 28.1, maxLat: 32.2 } },
    { name: '四川省', range: { minLng: 97.3, maxLng: 108.5, minLat: 26.0, maxLat: 34.3 } },
    { name: '贵州省', range: { minLng: 103.6, maxLng: 109.5, minLat: 24.6, maxLat: 29.2 } },
    { name: '云南省', range: { minLng: 97.5, maxLng: 106.2, minLat: 21.1, maxLat: 29.2 } }
  ];
  
  for (const province of provinceMap) {
    const { range, name } = province;
    if (
      lng >= range.minLng && 
      lng <= range.maxLng && 
      lat >= range.minLat && 
      lat <= range.maxLat
    ) {
      return {
        province: name,
        city: '未知城市',
        district: '未知区域',
        formatted_address: `${name}`
      };
    }
  }
  
  // 默认返回未知地区
  return {
    province: '未知省份',
    city: '未知城市',
    district: '未知区域',
    formatted_address: '未知地区'
  };
}

/**
 * 获取地理位置信息的包装函数，优先使用在线API，失败后降级到Web API，最后降级到离线查询
 * @param {string} longitude 经度
 * @param {string} latitude 纬度
 * @returns {Promise<Object>} 地理位置信息
 */
export async function getLocation(longitude, latitude) {
  if (!longitude || !latitude) {
    return { 
      province: '未知省份',
      city: '未知城市',
      district: '未知区县',
      formatted_address: '未知位置' 
    };
  }
  
  try {
    // 优先使用Web API（通过高德地图JS API获取，最可靠）
    const webLocation = await getLocationByWebAPI(longitude, latitude);
    if (webLocation) {
      console.log('Web API返回位置信息:', webLocation);
      return webLocation;
    }
    
    // 尝试使用在线REST API
    try {
      console.log('使用在线REST API获取位置信息:', longitude, latitude);
      const location = await getLocationByCoordinates(longitude, latitude);
      if (location) {
        console.log('在线REST API返回位置信息:', location);
        return location;
      }
    } catch (apiError) {
      console.error('在线REST API获取位置失败，降级到离线模式:', apiError);
    }
    
    // 降级到离线查询
    console.log('使用离线模式获取位置信息:', longitude, latitude);
    const offlineLocation = await getLocationOffline(longitude, latitude);
    console.log('离线模式返回位置信息:', offlineLocation);
    return offlineLocation;
  } catch (error) {
    console.error('获取位置信息失败:', error);
    return { 
      province: '未知省份',
      city: '未知城市',
      district: '未知区县',
      formatted_address: '位置解析失败' 
    };
  }
} 