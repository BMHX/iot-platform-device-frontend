<template>
  <div class="map-container">
    <div class="loading-overlay" v-if="mapLoading">
      <div class="loading-spinner">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>地图加载中...</span>
        <span class="loading-tip">首次加载可能需要较长时间，请耐心等待</span>
      </div>
    </div>
    <div id="map-container" class="map"></div>
    <div class="map-controls">
      <el-input
        v-model="searchText"
        placeholder="搜索地点..."
        class="search-input"
        clearable
        :loading="isLoading"
        @keyup.enter="searchLocation"
      >
        <template #append>
          <el-button @click="searchLocation" :loading="isLoading">
            <el-icon><Search /></el-icon>
          </el-button>
        </template>
      </el-input>
      
      <div class="selected-location" v-if="currentLocation.latitude && currentLocation.longitude">
        <div class="location-info">
          <div><strong>经度:</strong> {{ currentLocation.longitude }}</div>
          <div><strong>纬度:</strong> {{ currentLocation.latitude }}</div>
          <div v-if="locationInfo"><strong>地址:</strong> {{ locationInfo.formatted_address }}</div>
        </div>
        <el-button type="primary" size="small" @click="confirmLocation">确认位置</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { Search, Loading } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getLocation } from '@/api/location';

export default {
  components: {
    Search,
    Loading
  },
  props: {
    initialLongitude: {
      type: [String, Number],
      default: 116.397428 // 默认为北京中心位置
    },
    initialLatitude: {
      type: [String, Number],
      default: 39.90923 // 默认为北京中心位置
    }
  },
  data() {
    return {
      map: null,
      marker: null,
      searchText: '',
      currentLocation: {
        longitude: this.initialLongitude,
        latitude: this.initialLatitude
      },
      locationInfo: null,
      isLoading: false,
      mapLoading: true,
      resizeObserver: null
    };
  },
  mounted() {
    this.initMap();
    
    // 创建ResizeObserver来监听容器大小变化
    this.resizeObserver = new ResizeObserver(() => {
      if (this.map) {
        this.map.resize();
      }
    });
    
    // 监听地图容器
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
      this.resizeObserver.observe(mapContainer);
    }
  },
  beforeUnmount() {
    // 清理ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    // 销毁地图实例
    if (this.map) {
      this.map.destroy();
    }
  },
  methods: {
    initMap() {
      // 由于我们已经在index.html中加载了地图API，这里直接创建地图
      try {
        // 延迟一点时间确保DOM已准备好
        setTimeout(() => {
          // 确保AMap已加载
          if (window.AMap) {
            this.createMap();
          } else {
            console.error('高德地图API未加载');
            ElMessage.error('地图API未加载，请刷新页面重试');
            this.mapLoading = false;
          }
        }, 100);
      } catch (error) {
        console.error('初始化地图失败:', error);
        ElMessage.error('初始化地图失败: ' + error.message);
        this.mapLoading = false;
      }
    },
    createMap() {
      try {
        console.log('创建地图实例');
        
        // 显示加载信息
        ElMessage.info({
          message: '正在加载地图，请稍候...',
          duration: 2000
        });
        
        // 创建地图实例
        this.map = new window.AMap.Map('map-container', {
          zoom: 13,
          center: [this.currentLocation.longitude, this.currentLocation.latitude],
          viewMode: '2D', // 设置地图模式为2D
          mapStyle: 'normal', // 设置为标准地图样式，v1.4.15中不使用amap://styles/前缀
          resizeEnable: true, // 允许地图自适应大小变化
          doubleClickZoom: true, // 允许双击缩放
          
          // 启用瓦片加载的相关选项
          showBuildingBlock: true, // 显示楼块
          showLabel: true, // 显示标签
          
          // 设置缩放范围
          zooms: [3, 18], // v1.4.15支持的最大缩放级别为18
          
          // 启用旋转功能
          rotateEnable: true,
          pitchEnable: true,
          
          // 启用地图平滑缩放效果
          jogEnable: true,
        });
        
        // 添加错误处理
        this.map.on('error', (error) => {
          console.error('地图加载错误:', error);
          ElMessage.error('地图加载出现错误，请刷新页面重试');
          this.mapLoading = false;
        });
        
        // 添加地图载入中事件
        this.map.on('mapmove', () => {
          console.log('地图移动中');
        });
        
        // 地图加载完成事件
        this.map.on('complete', () => {
          console.log('地图加载完成');
          this.mapLoading = false;
          
          // 替换图层添加的部分，确保地图图层正确加载
          // 尝试添加卫星图层和路网图层
          try {
            // 确保图层可见
            const standardLayer = new window.AMap.TileLayer({
              visible: true,
              opacity: 1,
              zIndex: 0
            });
            
            // 添加底图图层
            this.map.add([standardLayer]);
            
            // 添加图层切换控件
            this.map.plugin(['AMap.MapType'], () => {
              const mapType = new window.AMap.MapType({
                defaultType: 0 // 默认显示标准图层
              });
              this.map.addControl(mapType);
            });
          } catch (error) {
            console.error('添加图层失败:', error);
            // 尝试备用方案
            try {
              // 备用方案：使用内置的卫星图层
              const layers = [
                new window.AMap.TileLayer(),
                new window.AMap.TileLayer.RoadNet()
              ];
              this.map.layers = layers;
            } catch (backupError) {
              console.error('备用图层添加失败:', backupError);
            }
          }
          
          ElMessage.success({
            message: '地图加载完成，您可以拖动标记或点击地图选择位置',
            duration: 3000
          });
          
          // 在地图加载完成后再次尝试添加控件
          // 确保移除所有已有的控件
          this.map.clearControl();
          
          // 重新添加指南针到左上角
          this.map.plugin(['AMap.ToolBar'], () => {
            const toolBar = new window.AMap.ToolBar({
              position: 'LT' // 左上角
            });
            this.map.addControl(toolBar);
          });
          
          // 添加比例尺
          this.map.plugin(['AMap.Scale'], () => {
            const scale = new window.AMap.Scale();
            this.map.addControl(scale);
          });
          
          // 添加定位控件
          this.map.plugin(['AMap.Geolocation'], () => {
            const geolocation = new window.AMap.Geolocation({
              position: 'RB', // 右下角
              buttonOffset: new window.AMap.Pixel(10, 20), // v1.4.15中使用buttonOffset
              showMarker: true, // 显示定位点
              buttonPosition: 'RB', // 按钮位置
              buttonDom: '<div style="background:#fff;border:1px solid #ccc;padding:5px;">定位</div>' // 自定义按钮样式
            });
            this.map.addControl(geolocation);
          });
          
          // 创建标记
          this.marker = new window.AMap.Marker({
            position: [this.currentLocation.longitude, this.currentLocation.latitude],
            draggable: true,
            cursor: 'move',
            animation: 'AMAP_ANIMATION_DROP' // 添加动画效果
          });
          
          // 将标记添加到地图
          this.map.add(this.marker);
          
          // 添加标记信息窗体
          const infoWindow = new window.AMap.InfoWindow({
            content: '<div style="padding: 10px;">拖动我到设备位置<br>或点击地图选择位置</div>',
            offset: new window.AMap.Pixel(0, -30)
          });
          
          // 默认打开信息窗体
          infoWindow.open(this.map, this.marker.getPosition());
          
          // 点击标记时打开信息窗体
          this.marker.on('click', () => {
            infoWindow.open(this.map, this.marker.getPosition());
          });
          
          // 点击地图时更新标记位置
          this.map.on('click', (e) => {
            const position = [e.lnglat.getLng(), e.lnglat.getLat()];
            this.marker.setPosition(position);
            infoWindow.open(this.map, position);
            this.updateLocationInfo(position[0], position[1]);
          });
          
          // 拖动标记时更新位置信息
          this.marker.on('dragend', () => {
            const position = this.marker.getPosition();
            infoWindow.open(this.map, position);
            this.updateLocationInfo(position.getLng(), position.getLat());
          });
          
          // 初始化位置信息
          this.updateLocationInfo(this.currentLocation.longitude, this.currentLocation.latitude);
        });
      } catch (error) {
        console.error('创建地图失败:', error);
        ElMessage.error('创建地图失败: ' + error.message);
      }
    },
    updateLocationInfo(longitude, latitude) {
      this.currentLocation.longitude = longitude;
      this.currentLocation.latitude = latitude;
      
      // 获取地址信息
      this.isLoading = true;
      
      // 直接使用地图的逆地理编码功能，更可靠
      if (window.AMap && window.AMap.Geocoder) {
        try {
          const geocoder = new window.AMap.Geocoder({
            radius: 1000,
            extensions: 'all'
          });
          
          geocoder.getAddress([longitude, latitude], (status, result) => {
            this.isLoading = false;
            
            if (status === 'complete' && result.regeocode) {
              const address = result.regeocode;
              const addressComponent = address.addressComponent;
              
              console.log('逆地理编码结果:', address);
              
              this.locationInfo = {
                province: addressComponent.province || '未知省份',
                city: addressComponent.city || addressComponent.province || '未知城市',
                district: addressComponent.district || '未知区县',
                township: addressComponent.township || '',
                formatted_address: address.formattedAddress || '未知地址'
              };
            } else {
              console.error('逆地理编码失败:', status);
              // 如果地图API失败，回退到我们的API
              this.fallbackGetLocation(longitude, latitude);
            }
          });
        } catch (error) {
          console.error('调用逆地理编码失败:', error);
          this.fallbackGetLocation(longitude, latitude);
        }
      } else {
        // 如果地图API不可用，回退到我们的API
        this.fallbackGetLocation(longitude, latitude);
      }
    },
    fallbackGetLocation(longitude, latitude) {
      getLocation(longitude, latitude)
        .then(info => {
          this.locationInfo = info;
        })
        .catch(error => {
          console.error('获取位置信息失败', error);
          ElMessage.error('获取位置信息失败');
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
    searchLocation() {
      if (!this.searchText.trim()) {
        ElMessage.warning('请输入搜索关键词');
        return;
      }
      
      if (!window.AMap) {
        ElMessage.error('地图尚未加载完成，请稍后再试');
        return;
      }
      
      // 显示加载状态
      this.isLoading = true;
      
      // 检查是否是省市区格式
      const districtPattern = /^([\u4e00-\u9fa5]+[省市])?([\u4e00-\u9fa5]+[市州])?([\u4e00-\u9fa5]+[区县])?$/;
      const isDistrict = districtPattern.test(this.searchText);
      
      // 检查是否仅是城市名称
      const cityPattern = /^(北京|上海|广州|深圳|杭州|南京|武汉|西安|成都|重庆|天津|苏州|青岛|大连|宁波|厦门|福州|济南|合肥|郑州|长沙|长春|哈尔滨|石家庄|太原|沈阳|南宁|昆明|贵阳|兰州|乌鲁木齐|拉萨|海口|三亚)$/;
      const isCity = cityPattern.test(this.searchText);
      
      console.log('搜索文本:', this.searchText);
      console.log('是否是行政区格式:', isDistrict);
      console.log('是否是城市名:', isCity);
      
      if (isCity) {
        // 如果是城市名，直接使用城市搜索
        this.searchCity(this.searchText);
      } else if (isDistrict) {
        // 如果是行政区格式，使用行政区划搜索
        this.searchDistrict(this.searchText);
      } else {
        // 否则使用地理编码搜索具体地点
        this.searchByGeocoder(this.searchText);
      }
    },
    searchCity(cityName) {
      console.log('搜索城市:', cityName);
      
      // 使用城市查询
      this.map.setCity(cityName, () => {
        this.isLoading = false;
        
        // 获取城市中心点
        const center = this.map.getCenter();
        
        // 更新标记位置到城市中心
        this.marker.setPosition(center);
        
        // 更新位置信息
        this.updateLocationInfo(center.getLng(), center.getLat());
        
        // 显示成功消息
        ElMessage.success({
          message: `已定位到城市: ${cityName}`,
          duration: 3000
        });
        
        // 打开信息窗体
        const infoWindow = new window.AMap.InfoWindow({
          content: `<div style="padding: 10px;">
            <div style="font-weight: bold;">${cityName}市中心</div>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">
              您可以拖动标记或点击地图选择更精确的位置
            </div>
          </div>`,
          offset: new window.AMap.Pixel(0, -30)
        });
        infoWindow.open(this.map, this.marker.getPosition());
      });
    },
    searchDistrict(districtName) {
      console.log('行政区划搜索:', districtName);
      
      // 如果只是城市名后面加了"市"字，则去掉市字再用城市搜索
      if (/^[\u4e00-\u9fa5]+市$/.test(districtName)) {
        const cityName = districtName.substring(0, districtName.length - 1);
        return this.searchCity(cityName);
      }
      
      try {
        // 创建行政区查询实例
        const districtSearch = new window.AMap.DistrictSearch({
          level: 'district', // 行政区级别
          showbiz: false,    // 不显示商圈
          extensions: 'all'  // 返回行政区边界坐标
        });
        
        districtSearch.search(districtName, (status, result) => {
          this.isLoading = false;
          
          if (status === 'complete' && result.districtList && result.districtList.length > 0) {
            const district = result.districtList[0];
            console.log('行政区查询结果:', district);
            
            // 获取行政区中心点
            const center = district.center;
            if (!center) {
              console.error('无法获取行政区中心点');
              return this.searchByGeocoder(districtName); // 回退到地理编码搜索
            }
            
            // 设置地图中心和缩放级别
            this.map.setZoomAndCenter(12, center, true);
            
            // 更新标记位置
            this.marker.setPosition(center);
            
            // 如果有边界数据，绘制边界
            if (district.boundaries && district.boundaries.length > 0) {
              try {
                // 创建多边形覆盖物
                const polygons = [];
                district.boundaries.forEach(boundary => {
                  const polygon = new window.AMap.Polygon({
                    path: boundary,
                    strokeColor: '#3366FF',
                    strokeWeight: 2,
                    strokeOpacity: 0.5,
                    fillColor: '#99CCFF',
                    fillOpacity: 0.3
                  });
                  polygons.push(polygon);
                });
                
                // 添加到地图
                this.map.add(polygons);
                
                // 设置地图视野到行政区范围
                this.map.setFitView(polygons);
              } catch (error) {
                console.error('绘制行政区边界失败:', error);
              }
            }
            
            // 更新位置信息
            this.updateLocationInfo(center.lng || center[0], center.lat || center[1]);
            
            // 显示成功消息
            ElMessage.success({
              message: `已定位到: ${district.name}`,
              duration: 3000
            });
            
            // 打开信息窗体
            const infoWindow = new window.AMap.InfoWindow({
              content: `<div style="padding: 10px;">
                <div style="font-weight: bold;">${district.name}</div>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">
                  您可以点击地图或拖动标记选择更精确的位置
                </div>
              </div>`,
              offset: new window.AMap.Pixel(0, -30)
            });
            infoWindow.open(this.map, this.marker.getPosition());
          } else {
            console.error('行政区查询失败，回退到地理编码搜索');
            this.searchByGeocoder(districtName); // 回退到地理编码搜索
          }
        });
      } catch (error) {
        console.error('行政区查询失败:', error);
        this.isLoading = false;
        // 回退到地理编码搜索
        this.searchByGeocoder(districtName);
      }
    },
    confirmLocation() {
      // 向父组件发送位置信息
      this.$emit('location-selected', {
        longitude: this.currentLocation.longitude,
        latitude: this.currentLocation.latitude,
        address: this.locationInfo ? this.locationInfo.formatted_address : null
      });
    },
    searchByGeocoder(keyword) {
      console.log('地理编码搜索:', keyword);
      
      // 使用高德地图地理编码服务搜索地点
      const geocoder = new window.AMap.Geocoder({
        city: "全国", // 设置为全国范围搜索
        radius: 1000, // 设置较大搜索半径
        batch: true, // 批量查询
        extensions: "all" // 返回完整地址信息
      });
      
      geocoder.getLocation(keyword, (status, result) => {
        this.isLoading = false;
        
        if (status === 'complete' && result.info === 'OK') {
          if (!result.geocodes || result.geocodes.length === 0) {
            console.log('未找到匹配的地点，尝试模糊搜索');
            return this.fuzzySearch(keyword); // 尝试模糊搜索
          }
          
          const location = result.geocodes[0];
          const position = location.location;
          
          console.log('搜索结果:', location);
          
          // 更新地图中心点和标记位置
          this.map.setZoomAndCenter(14, position, true);
          this.marker.setPosition(position);
          
          // 打开信息窗体
          const infoWindow = new window.AMap.InfoWindow({
            content: `<div style="padding: 10px;">
              <div style="font-weight: bold;">${location.formattedAddress}</div>
              <div style="font-size: 12px; color: #666; margin-top: 5px;">点击确认选择此位置</div>
            </div>`,
            offset: new window.AMap.Pixel(0, -30)
          });
          infoWindow.open(this.map, position);
          
          // 更新位置信息
          this.updateLocationInfo(position.lng || position.getLng(), position.lat || position.getLat());
          
          // 添加一些动画效果
          this.marker.setAnimation('AMAP_ANIMATION_BOUNCE');
          setTimeout(() => {
            this.marker.setAnimation(null);
          }, 2000);
          
          ElMessage.success({
            message: `已找到地点: ${location.formattedAddress}`,
            duration: 3000
          });
        } else {
          console.error('地理编码搜索失败:', status, result);
          this.fuzzySearch(keyword); // 尝试模糊搜索
        }
      });
    },
    fuzzySearch(keyword) {
      console.log('尝试模糊搜索:', keyword);
      
      try {
        // 使用高德地图的自动完成服务
        const autoComplete = new window.AMap.Autocomplete({
          city: '全国',
          citylimit: false, // 不限制城市
          datatype: 'poi' // 搜索POI点
        });
        
        autoComplete.search(keyword, (status, result) => {
          this.isLoading = false;
          
          if (status === 'complete' && result.tips && result.tips.length > 0) {
            const firstTip = result.tips[0];
            console.log('自动完成结果:', firstTip);
            
            // 如果是POI点且有位置信息
            if (firstTip.location) {
              const position = firstTip.location;
              
              // 更新地图中心点和标记位置
              this.map.setZoomAndCenter(14, position, true);
              this.marker.setPosition(position);
              
              // 更新位置信息
              this.updateLocationInfo(position.lng, position.lat);
              
              // 打开信息窗体
              const infoWindow = new window.AMap.InfoWindow({
                content: `<div style="padding: 10px;">
                  <div style="font-weight: bold;">${firstTip.name}</div>
                  <div style="font-size: 12px; color: #909399;">
                    ${firstTip.district}
                  </div>
                </div>`,
                offset: new window.AMap.Pixel(0, -30)
              });
              infoWindow.open(this.map, position);
              
              ElMessage.success({
                message: `找到相似地点: ${firstTip.name}`,
                duration: 3000
              });
            } else {
              // 如果没有位置信息，使用POI搜索
              this.searchPOI(firstTip.name);
            }
          } else {
            ElMessage.error({
              message: '搜索失败，请尝试其他关键词或更精确的地址',
              duration: 3000
            });
          }
        });
      } catch (error) {
        console.error('模糊搜索失败:', error);
        this.isLoading = false;
        
        ElMessage.error({
          message: '搜索失败，请尝试其他关键词或更精确的地址',
          duration: 3000
        });
      }
    },
    searchPOI(keyword) {
      console.log('POI搜索:', keyword);
      
      try {
        // 使用高德地图的PlaceSearch服务
        const placeSearch = new window.AMap.PlaceSearch({
          city: '全国',
          citylimit: false, // 不限制城市
          autoFitView: true // 自动调整地图视野
        });
        
        placeSearch.search(keyword, (status, result) => {
          this.isLoading = false;
          
          if (status === 'complete' && result.poiList && result.poiList.pois && result.poiList.pois.length > 0) {
            const firstPOI = result.poiList.pois[0];
            console.log('POI搜索结果:', firstPOI);
            
            const position = firstPOI.location;
            
            // 更新地图中心点和标记位置
            this.map.setZoomAndCenter(14, position, true);
            this.marker.setPosition(position);
            
            // 更新位置信息
            this.updateLocationInfo(position.lng, position.lat);
            
            // 打开信息窗体
            const infoWindow = new window.AMap.InfoWindow({
              content: `<div style="padding: 10px;">
                <div style="font-weight: bold;">${firstPOI.name}</div>
                <div style="font-size: 12px; color: #909399;">
                  ${firstPOI.address || firstPOI.cityname + firstPOI.adname}
                </div>
              </div>`,
              offset: new window.AMap.Pixel(0, -30)
            });
            infoWindow.open(this.map, position);
            
            ElMessage.success({
              message: `找到地点: ${firstPOI.name}`,
              duration: 3000
            });
          } else {
            ElMessage.error({
              message: '搜索失败，请尝试其他关键词或更精确的地址',
              duration: 3000
            });
          }
        });
      } catch (error) {
        console.error('POI搜索失败:', error);
        this.isLoading = false;
        
        ElMessage.error({
          message: '搜索失败，请尝试其他关键词或更精确的地址',
          duration: 3000
        });
      }
    }
  }
};
</script>

<style scoped>
.map-container {
  width: 100%;
  position: relative;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.map {
  width: 100%;
  height: 400px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 400px;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #409EFF;
}

.loading-spinner .el-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.loading-tip {
  font-size: 12px;
  color: #606266;
  margin-top: 5px;
}

.map-controls {
  padding: 10px;
  background-color: #f5f7fa;
  border-top: 1px solid #dcdfe6;
}

.search-input {
  margin-bottom: 10px;
}

.selected-location {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #ecf5ff;
  border-radius: 4px;
}

.location-info {
  flex: 1;
}
</style> 