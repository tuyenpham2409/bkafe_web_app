import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getToken } from './storage';

// Resolve the BKafe API base URL automatically:
// - On a physical device / Android emulator, `localhost` refers to the device
//   itself, not the dev machine, so we reuse the LAN IP that Expo already used
//   to serve the JS bundle (Constants.expoConfig.hostUri, e.g. "192.168.1.5:8081").
// - Android emulator (not a real device) uses the special alias 10.0.2.2.
// - Everything else (web, iOS simulator) can just use localhost.
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

async function request(path, { method = 'GET', body, isForm } = {}) {
  const headers = {};
  const token = await getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (isForm) {
    payload = body; // FormData: let RN set the multipart boundary
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
