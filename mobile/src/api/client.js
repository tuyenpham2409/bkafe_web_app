import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getToken } from './storage';

function resolveApiUrl() {
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;
  const host = hostUri ? hostUri.split(':')[0] : null;

  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:5000/api`;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  return 'http://localhost:5000/api';
}

export const API_URL = resolveApiUrl();

function resolveWebUrl() {
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;
  const host = hostUri ? hostUri.split(':')[0] : null;

  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:3000`;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }
  return 'http://localhost:3000';
}

export const WEB_URL = resolveWebUrl();

async function request(path, { method = 'GET', body, isForm } = {}) {
  const headers = {};
  const token = await getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (isForm) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: payload });
  } catch (e) {
    throw new Error(`Không kết nối được máy chủ API (${API_URL}). Kiểm tra server đã chạy và cùng mạng Wi-Fi.`);
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || `Lỗi ${res.status}`);
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body }),
  put: (p, body) => request(p, { method: 'PUT', body }),
  patch: (p, body) => request(p, { method: 'PATCH', body }),
  del: (p) => request(p, { method: 'DELETE' }),
  postForm: (p, form) => request(p, { method: 'POST', body: form, isForm: true }),
  putForm: (p, form) => request(p, { method: 'PUT', body: form, isForm: true }),
};

export function resolveMediaUrl(url) {
  if (!url) return '';
  if (typeof url === 'string' && url.includes('localhost:5000')) {
    const serverBase = API_URL.replace('/api', '');
    return url.replace('http://localhost:5000', serverBase);
  }
  return url;
}
