<template>
  <div class="statistics-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>摄像头监控与管理</span>
      </div>
      </template>
      <el-row :gutter="20">
        <!-- 左侧视频播放器区域 -->
        <el-col :span="16">
          <div class="video-player-container">
            <div v-if="currentCamera && currentCamera.type.toLowerCase() === 'rtsp'" class="video-box">
              <video ref="videoRef" class="video-js vjs-default-skin" controls preload="auto" width="100%" height="auto">
                您的浏览器不支持 HTML5 视频。
              </video>
    </div>
            <div v-else-if="currentCamera && currentCamera.type.toLowerCase() === 'hls'" class="video-box">
              <canvas ref="canvasRef" width="1280" height="720" style="background: black;"></canvas>
      </div>
            <div v-else class="video-placeholder">
              <span>请选择摄像头进行监控</span>
      </div>
            <div class="video-controls" v-if="currentCamera && currentCamera.type.toLowerCase() === 'hls'">
              <el-button type="primary" @click="startRecording" :disabled="isRecording">开始录制</el-button>
              <el-button type="warning" @click="stopRecording" :disabled="!isRecording">停止录制</el-button>
              <el-button type="success" @click="startPlayback" :disabled="isPlayingback || recordedFrames.length === 0">回看</el-button>
              <el-button type="info" @click="stopPlayback" :disabled="!isPlayingback">停止回看</el-button>
              <el-button type="danger" @click="clearRecordedFrames" :disabled="recordedFrames.length === 0">清空录制</el-button>
      </div>
    </div>
        </el-col>

        <!-- 右侧摄像头列表和管理 -->
        <el-col :span="8">
          <div class="camera-list-container">
            <el-button type="primary" @click="openAddDialog" style="margin-bottom: 20px;">添加摄像头</el-button>

            <el-table :data="cameraList" style="width: 100%;" border>
              <el-table-column prop="name" label="名称" width="120"></el-table-column>
              <el-table-column prop="type" label="类型" width="80"></el-table-column>
              <el-table-column label="操作" width="auto">
                <template #default="scope">
                  <el-button size="small" @click="playVideo(scope.row)">监控</el-button>
                  <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 添加/编辑摄像头对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑摄像头' : '添加摄像头'" width="500px">
      <el-form :model="form" ref="formRef" :rules="rules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name"></el-input>
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择摄像头类型">
            <el-option label="RTSP" value="rtsp"></el-option>
            <el-option label="HLS" value="hls"></el-option>
            <!-- 更多类型 -->
          </el-select>
        </el-form-item>
        <el-form-item label="流地址" prop="streamUrl">
          <el-input v-model="form.streamUrl"></el-input>
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="form.username"></el-input>
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="isEdit ? handleUpdate() : handleSubmit()">
            {{ isEdit ? '更新' : '添加' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
// import flvjs from 'flv.js'; // 暂时不需要flv.js，因为切换到MJPEG/Canvas
// import Hls from 'hls.js'; // 暂时不需要Hls.js

// 响应式数据
const cameraList = ref([]);
const currentCamera = ref(null);
const videoRef = ref(null);
const canvasRef = ref(null);
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref(null);
const form = ref({
  id: null,
  name: '',
  type: '',
  streamUrl: '',
  username: '',
  password: '',
});

// 视频播放器实例 (用于flv.js或hls.js)
let flvPlayerInstance = null; // 用于存储flv.js实例
let mjpegStreamReader; // 用于存储MJPEG流的reader

// 录制相关
const isRecording = ref(false);
const recordedFrames = ref([]); // 存储录制的Blob图片帧
const isPlayingback = ref(false);
let playbackTimer = null; // 用于回放的定时器
let currentPlaybackFrameIndex = 0; // 当前回放帧的索引

// 录制函数
const startRecording = () => {
  console.log('开始录制...');
  // 如果正在回放，先停止回放
  if (isPlayingback.value) {
    stopPlayback();
  }
  recordedFrames.value = []; // 清空之前的录制
  isRecording.value = true;
  ElMessage.success('开始录制视频！');
};

const stopRecording = () => {
  console.log('停止录制。');
  isRecording.value = false;
  ElMessage.info(`录制停止，共录制 ${recordedFrames.value.length} 帧。`);
};

const clearRecordedFrames = () => {
  console.log('清空录制的帧。');
  recordedFrames.value.forEach(blob => URL.revokeObjectURL(blob)); // 释放Blob URL资源
  recordedFrames.value = [];
  currentPlaybackFrameIndex = 0;
  ElMessage.info('录制的帧已清空。');
};

// 表单校验规则
const rules = {
  name: [{ required: true, message: '请输入摄像头名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择摄像头类型', trigger: 'change' }],
  streamUrl: [{ required: true, message: '请输入流地址', trigger: 'blur' }],
};

// 打开添加摄像头对话框
const openAddDialog = () => {
  isEdit.value = false;
  form.value = {
    id: null,
    name: '',
    type: '',
    streamUrl: '',
    username: 'admin',
    password: 'admin',
  };
  dialogVisible.value = true;
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

// 编辑摄像头
const handleEdit = (row) => {
  console.log('准备编辑摄像头，原始数据:', row);
  isEdit.value = true;
  form.value = {
    id: row.id,
    name: row.name,
    type: row.type,
    streamUrl: row.streamUrl,
    username: row.username || 'admin',  // 设置默认值
    password: row.password || 'admin'   // 设置默认值
  };
  console.log('编辑表单初始化数据:', form.value);
  dialogVisible.value = true;
};

// 更新摄像头
const handleUpdate = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        console.log('更新摄像头，表单数据:', form.value);
        // 确保认证信息存在
        if (!form.value.username || !form.value.password) {
          ElMessage.warning('请填写摄像头的用户名和密码');
          return;
        }
        const response = await axios.put('/api/camera', form.value);
        console.log('更新摄像头响应:', response);
        if (response.data.code === 0) {
          ElMessage.success('摄像头更新成功!');
          dialogVisible.value = false;
          // 立即更新本地列表中的摄像头信息
          const index = cameraList.value.findIndex(c => c.id === form.value.id);
          if (index !== -1) {
            cameraList.value[index] = { ...form.value };
          }
          getCameraList(); // 重新获取列表
        } else {
          ElMessage.error('摄像头更新失败: ' + (response.data.msg || '未知错误'));
        }
      } catch (error) {
        console.error('更新摄像头失败:', error);
        if (error.response) {
          console.error('错误状态码:', error.response.status);
          console.error('错误数据:', error.response.data);
        }
        ElMessage.error('更新摄像头失败: ' + (error.response?.data?.msg || error.message));
      }
    } else {
      ElMessage.warning('请检查表单填写是否完整和正确。');
      return false;
    }
  });
};

// 提交新摄像头
const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        console.log('提交新摄像头，表单数据:', form.value);
        // 确保认证信息存在
        if (!form.value.username || !form.value.password) {
          ElMessage.warning('请填写摄像头的用户名和密码');
          return;
        }
        const response = await axios.post('/api/camera', form.value);
        console.log('添加摄像头响应:', response);
        if (response.data.code === 0) {
          ElMessage.success('摄像头添加成功!');
          dialogVisible.value = false;
          getCameraList(); // 重新获取列表
        } else {
          ElMessage.error('摄像头添加失败: ' + (response.data.msg || '未知错误'));
        }
      } catch (error) {
        console.error('添加摄像头失败:', error);
        if (error.response) {
          console.error('错误状态码:', error.response.status);
          console.error('错误数据:', error.response.data);
        }
        ElMessage.error('添加摄像头失败: ' + (error.response?.data?.msg || error.message));
      }
    } else {
      ElMessage.warning('请检查表单填写是否完整和正确。');
      return false;
    }
  });
};

// 删除摄像头
const handleDelete = async (id) => {
  ElMessageBox.confirm('确定要删除此摄像头吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        const response = await axios.delete(`/api/camera/${id}`);
        if (response.data.code === 0) {
          ElMessage.success('摄像头删除成功!');
          getCameraList(); // 重新获取列表
          if (currentCamera.value && currentCamera.value.id === id) {
            currentCamera.value = null; // 如果删除的是当前播放的摄像头，则清空
            if (flvPlayerInstance) {
              flvPlayerInstance.destroy();
              flvPlayerInstance = null;
            }
            if (mjpegStreamReader) {
                mjpegStreamReader.abort();
                mjpegStreamReader = null;
            }
          }
        } else {
          ElMessage.error('摄像头删除失败: ' + (response.data.msg || '未知错误'));
        }
      } catch (error) {
        console.error('删除摄像头失败:', error);
        ElMessage.error('删除摄像头失败: ' + (error.response?.data?.msg || error.message));
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除。');
    });
};

// 获取摄像头列表
const getCameraList = async () => {
  console.log('开始获取摄像头列表');
  try {
    const response = await axios.get('/api/camera/list');
    console.log('摄像头列表响应:', response);
    if (response.data.code === 0) {
      cameraList.value = response.data.data;
      console.log('成功获取摄像头列表，详细信息:', cameraList.value.map(camera => ({
        id: camera.id,
        name: camera.name,
        type: camera.type,
        streamUrl: camera.streamUrl,
        username: camera.username,
        password: camera.password
      })));
    } else {
      ElMessage.error('获取摄像头列表失败: ' + (response.data.msg || '未知错误'));
    }
  } catch (error) {
    console.error('获取摄像头列表失败:', error);
    if (error.response) {
      console.error('错误状态码:', error.response.status);
      console.error('错误数据:', error.response.data);
    }
    ElMessage.error('获取摄像头列表失败: ' + (error.response?.data?.msg || error.message));
  }
}

// 播放视频流
const playVideo = async (camera) => {
  try {
    // 检查摄像头对象的完整性
    console.log('准备播放视频，摄像头信息:', {
      id: camera.id,
      name: camera.name,
      type: camera.type,
      streamUrl: camera.streamUrl,
      username: camera.username,
      password: camera.password
    });

    // 验证必要的字段
    if (!camera.username || !camera.password) {
      throw new Error('摄像头缺少认证信息，请先编辑摄像头添加用户名和密码');
    }

    // 停止并清理之前的播放器实例或流
    if (flvPlayerInstance) {
      flvPlayerInstance.destroy();
      flvPlayerInstance = null;
    }
    if (mjpegStreamReader) {
        mjpegStreamReader.abort(); // 中止Fetch请求
        mjpegStreamReader = null;
    }
    // 确保canvas清空
    if (canvasRef.value) {
      const ctx = canvasRef.value.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
    }
    
    // 如果正在回放，先停止回放
    if (isPlayingback.value) {
      stopPlayback();
    }

    currentCamera.value = camera;
    console.log('开始播放视频:', camera);

    // 等待DOM更新，确保video或canvas元素存在
    await nextTick();

    if (camera.type.toLowerCase() === 'rtsp') {
      // RTSP 播放逻辑 (如果有，这里保留)
      // 目前我们的RTSP是通过flv.js代理的，需要确保flv.js可用并配置
      // 如果flv.js不可用，可能需要使用videojs-contrib-hls或其他RTSP兼容方案
      const videoElement = videoRef.value;
      if (!videoElement) {
        throw new Error('找不到视频播放器元素');
      }

      if (flvjs.isSupported()) {
        flvPlayerInstance = flvjs.createPlayer({
          type: 'flv',
          url: camera.streamUrl,
        });
        flvPlayerInstance.attachMediaElement(videoElement);
        flvPlayerInstance.load();
        videoElement.play();
      } else {
        ElMessage.error('您的浏览器不支持FLV播放，请尝试其他浏览器或检查FLV.js是否正确加载。');
      }
    } else if (camera.type.toLowerCase() === 'hls') {
      console.log('使用MJPEG通过代理播放视频流 (Canvas):', camera.streamUrl + '/video');

      const canvasElement = canvasRef.value;
      if (!canvasElement) {
          throw new Error('找不到Canvas播放器元素');
      }
      const ctx = canvasElement.getContext('2d');
      
      const streamToProxy = camera.streamUrl + '/video';
      const proxyUrl = `/api/proxy/stream?url=${encodeURIComponent(streamToProxy)}`;

      // 将camera对象传递给readMjpegStream函数
      await readMjpegStream(proxyUrl, canvasElement, ctx, camera);
    } else {
      throw new Error('不支持的视频流类型: ' + camera.type);
    }
  } catch (error) {
    console.error('视频播放器初始化失败:', error);
    ElMessage.error('视频播放器初始化失败: ' + error.message);
    currentCamera.value = null;
  }
}

// 读取MJPEG流并显示在Canvas上
const readMjpegStream = async (proxyUrl, canvasElement, ctx, camera) => {
  console.log('开始读取MJPEG流，使用认证信息:', { username: camera.username, password: camera.password });

  let authString = '';
  if (camera.username && camera.password) {
    authString = btoa(`${camera.username}:${camera.password}`);
  }

  console.log('生成的认证头:', authString ? `Basic ${authString}` : '无');

  let controller = new AbortController();
  mjpegStreamReader = controller.signal; // 保存controller.signal用于中止

  try {
    const response = await fetch(proxyUrl, {
      headers: {
        'Authorization': authString ? `Basic ${authString}` : '',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error('代理请求失败:', { status: response.status, statusText: response.statusText, headers: response.headers });
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const contentType = response.headers.get('Content-Type');
    console.log('收到响应Content-Type:', contentType);

    if (!contentType || !contentType.includes('multipart/x-mixed-replace')) {
      throw new Error('收到的不是MJPEG流，Content-Type: ' + contentType);
    }

    // 提取boundary字符串
    const boundaryMatch = /boundary=(.+)/.exec(contentType);
    if (!boundaryMatch) {
      throw new Error('无法从Content-Type中找到boundary');
    }
    const boundary = boundaryMatch[1]; // 修正：直接使用匹配到的boundary字符串，因为它已经包含了--

    // MJPEG流的实际帧边界通常是 \r\n--boundary_string
    const fullBoundaryPatternBytes = new TextEncoder().encode(`\r\n${boundary}`);
    const doubleCRLF = new Uint8Array([13, 10, 13, 10]); // \r\n\r\n
    console.log('MJPEG Boundary (extracted):', boundary);
    console.log('MJPEG Full Boundary Pattern Bytes:', fullBoundaryPatternBytes);

    const reader = response.body.getReader();
    let buffer = new Uint8Array(0);

    while (true) {
      if (mjpegStreamReader.aborted) {
        console.log('MJPEG流读取已取消。');
        break;
      }

      const { done, value } = await reader.read();
      console.log(`读取到数据块: done=${done}, value.length=${value ? value.length : 0}`);
      
      if (done) {
        console.log('MJPEG流已结束。');
        break;
      }

      // 追加到缓冲区
      const newBuffer = new Uint8Array(buffer.length + value.length);
      newBuffer.set(buffer);
      newBuffer.set(value, buffer.length);
      buffer = newBuffer;
      console.log('当前缓冲区大小:', buffer.length);

      let boundaryStart = -1;
      // 每次循环都尝试找到下一个完整的帧
      while ((boundaryStart = findBoundary(buffer, fullBoundaryPatternBytes)) !== -1) {
        console.log('找到帧起始边界索引:', boundaryStart);

        // 查找下一个边界，以确定当前帧的结束
        // 从当前边界的末尾开始查找，以避免重复查找当前边界
        const searchStartIndexForNextBoundary = boundaryStart + fullBoundaryPatternBytes.length;
        let nextBoundaryRelativeIndex = findBoundary(buffer.slice(searchStartIndexForNextBoundary), fullBoundaryPatternBytes);

        if (nextBoundaryRelativeIndex !== -1) {
          const nextBoundaryAbsoluteIndex = searchStartIndexForNextBoundary + nextBoundaryRelativeIndex;
          console.log('找到下一帧起始边界索引:', nextBoundaryAbsoluteIndex);

          // 提取当前帧（包含头部和图像数据）
          const currentFrameSegment = buffer.slice(boundaryStart + fullBoundaryPatternBytes.length, nextBoundaryAbsoluteIndex);

          // 在当前帧段中查找 \r\n\r\n (双回车换行) 来确定头部结束和图像数据开始
          let headerEndIndex = -1;
          for (let i = 0; i < currentFrameSegment.length - doubleCRLF.length; i++) {
            if (currentFrameSegment[i] === doubleCRLF[0] &&
                currentFrameSegment[i+1] === doubleCRLF[1] &&
                currentFrameSegment[i+2] === doubleCRLF[2] &&
                currentFrameSegment[i+3] === doubleCRLF[3]) {
                headerEndIndex = i + doubleCRLF.length;
                break;
            }
          }

          if (headerEndIndex !== -1) {
            const imageData = currentFrameSegment.slice(headerEndIndex);
            console.log('成功提取图像数据，大小:', imageData.length);

            // 检查是否是有效的JPEG数据 (简单的头部检查)
            if (imageData.length > 4 && imageData[0] === 0xFF && imageData[1] === 0xD8 && imageData[2] === 0xFF && (imageData[3] === 0xE0 || imageData[3] === 0xE1)) {
              try {
                const blob = new Blob([imageData], { type: 'image/jpeg' });
                // 如果正在录制，则保存帧
                if (isRecording.value) {
                  recordedFrames.value.push(blob);
                }

                const imageUrl = URL.createObjectURL(blob);
                const img = new Image();
                
                img.onload = () => {
                  if (canvasElement) {
                    // 清空canvas并绘制图像
                    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                    // 保持宽高比填充
                    const aspectRatio = img.width / img.height;
                    let drawWidth = canvasElement.width;
                    let drawHeight = drawWidth / aspectRatio;

                    if (drawHeight > canvasElement.height) {
                      drawHeight = canvasElement.height;
                      drawWidth = drawHeight * aspectRatio;
                    }
                    const x = (canvasElement.width - drawWidth) / 2;
                    const y = (canvasElement.height - drawHeight) / 2;

                    ctx.drawImage(img, x, y, drawWidth, drawHeight);
                  }
                  URL.revokeObjectURL(imageUrl);
                };
                img.onerror = (e) => {
                  console.error('图像加载失败:', e);
                  URL.revokeObjectURL(imageUrl);
                };
                img.src = imageUrl;
              } catch (e) {
                console.error('处理图像失败:', e);
              }
            } else {
              console.warn('跳过非JPEG图像数据或不完整数据，大小:', imageData.length);
            }
          } else {
            console.warn('未找到图像头部结束标记 (\r\n\r\n) 在当前帧段中，段大小:', currentFrameSegment.length);
          }

          // 裁剪缓冲区，移除已处理的帧
          buffer = buffer.slice(nextBoundaryAbsoluteIndex);
        } else {
          // 没有找到下一个边界，意味着需要更多数据来完成当前帧
          break; // 跳出内部while循环，等待更多数据
        }
      }
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('MJPEG流处理失败:', error);
      // ElMessage.error('MJPEG流播放失败: ' + error.message);
    }
  } finally {
    if (reader) {
      reader.releaseLock();
    }
    mjpegStreamReader = null;
    controller = null;
  }
};

// 查找字节数组中的子数组 (用于查找MJPEG边界)
const findBoundary = (buffer, searchBytes) => {
  for (let i = 0; i < buffer.length - searchBytes.length; i++) {
    let found = true;
    for (let j = 0; j < searchBytes.length; j++) {
      if (buffer[i + j] !== searchBytes[j]) {
        found = false;
        break;
      }
    }
    if (found) {
      return i;
    }
  }
  return -1;
};

// 回放函数
const startPlayback = () => {
  if (recordedFrames.value.length === 0) {
    ElMessage.warning('没有录制的视频帧可供回放。');
    return;
  }
  // 停止当前实时监控（如果正在进行）
  if (mjpegStreamReader) {
    mjpegStreamReader.abort();
    mjpegStreamReader = null;
  }
  if (flvPlayerInstance) {
    flvPlayerInstance.destroy();
    flvPlayerInstance = null;
  }

  isPlayingback.value = true;
  currentPlaybackFrameIndex = 0; // 从第一帧开始回放
  ElMessage.success('开始回放录制的视频！');

  const canvasElement = canvasRef.value;
  if (!canvasElement) {
    ElMessage.error('找不到Canvas播放器元素进行回放。');
    stopPlayback();
    return;
  }
  const ctx = canvasElement.getContext('2d');
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // 设置回放帧率，假设每秒25帧，则每帧间隔 1000 / 25 = 40ms
  const frameInterval = 40; 

  playbackTimer = setInterval(() => {
    if (currentPlaybackFrameIndex < recordedFrames.value.length) {
      const blob = recordedFrames.value[currentPlaybackFrameIndex];
      const imageUrl = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        if (canvasElement) {
          ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
          const aspectRatio = img.width / img.height;
          let drawWidth = canvasElement.width;
          let drawHeight = drawWidth / aspectRatio;

          if (drawHeight > canvasElement.height) {
            drawHeight = canvasElement.height;
            drawWidth = drawHeight * aspectRatio;
          }
          const x = (canvasElement.width - drawWidth) / 2;
          const y = (canvasElement.height - drawHeight) / 2;
          ctx.drawImage(img, x, y, drawWidth, drawHeight);
        }
        URL.revokeObjectURL(imageUrl);
      };
      img.onerror = (e) => {
        console.error('回放图像加载失败:', e);
        URL.revokeObjectURL(imageUrl);
      };
      img.src = imageUrl;
      currentPlaybackFrameIndex++;
    } else {
      // 回放结束，停止定时器并重置状态
      stopPlayback();
      ElMessage.info('回放结束。');
      // 可以选择在这里重新开始回放或者回到实时监控
      // 例如：startPlayback(); // 循环回放
    }
  }, frameInterval);
};

const stopPlayback = () => {
  if (playbackTimer) {
    clearInterval(playbackTimer);
    playbackTimer = null;
  }
  isPlayingback.value = false;
  ElMessage.info('回放已停止。');
};

// 组件挂载时获取摄像头列表
    onMounted(() => {
  getCameraList();
});

// 组件卸载时清理资源
onUnmounted(() => {
  if (flvPlayerInstance) {
    flvPlayerInstance.destroy();
    flvPlayerInstance = null;
  }
  if (mjpegStreamReader) {
      mjpegStreamReader.abort(); // 中止Fetch请求
      mjpegStreamReader = null;
  }
  stopPlayback(); // 停止回放
  clearRecordedFrames(); // 清理录制帧
});
</script>

<style scoped>
.statistics-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.video-player-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  height: 500px; /* 固定高度 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
}

.video-box {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: black;
}

.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
  color: #909399;
  font-size: 20px;
}

.video-controls {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.5);
  padding: 10px;
  border-radius: 5px;
  display: flex;
  gap: 10px;
}

.camera-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
