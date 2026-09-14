import { baseUrl, apiPath } from '@/sheep/config';
import { getAccessToken, getTenantId } from '@/sheep/request';
import { edu } from './api';
export function uploadEducationFile(filePath, studentId, onProgress = () => {}) {
  const token = getAccessToken();
  return new Promise((resolve, reject) => {
    const task = uni.uploadFile({
      url: baseUrl + apiPath + '/edu/file/upload',
      filePath,
      name: 'file',
      header: {
        Authorization: token.startsWith('Bearer ') ? token : 'Bearer ' + token,
        'tenant-id': getTenantId(),
      },
      formData: { studentId },
      success: (r) => {
        try {
          const result = JSON.parse(r.data);
          if (result.code !== 0 || !result.data?.fileId)
            throw new Error(result.msg || '文件尚未保存，请重试');
          resolve(result.data);
        } catch (e) {
          reject(e);
        }
      },
      fail: (e) =>
        reject(
          new Error(
            /no such file|not found|not exist|ENOENT|文件不存在|file.*(?:missing|expired)|path.*invalid/i.test(
              e.errMsg || '',
            )
              ? '临时文件已失效，请仅重新选择这一项'
              : '文件上传失败，请检查网络后重试',
          ),
        ),
    });
    task.onProgressUpdate?.((e) => onProgress(e.progress));
  });
}
export async function openMaterial(fileId, studentId, name = '学习资料') {
  const result = await edu.fileUrl(fileId, studentId);
  const url = typeof result === 'string' ? result : result.url;
  if (!url || !/^(https?:\/\/|\/)/i.test(url)) throw new Error('资料地址暂不可用');
  const downloaded = await uni.downloadFile({
    url: url.startsWith('/') ? baseUrl + url : url,
    header: result.headers || {},
  });
  if (downloaded.statusCode !== 200) throw new Error('资料下载失败，请重新获取');
  // #ifdef H5
  const a = document.createElement('a');
  a.href = downloaded.tempFilePath;
  a.download = name;
  a.click();
  return;
  // #endif
  // #ifndef H5
  if (/\.(png|jpe?g|webp|gif)$/i.test(name)) uni.previewImage({ urls: [downloaded.tempFilePath] });
  else
    uni.openDocument({
      filePath: downloaded.tempFilePath,
      showMenu: true,
      fail: () => uni.showToast({ title: '请在电脑端查看此文件格式', icon: 'none' }),
    });
  // #endif
}
