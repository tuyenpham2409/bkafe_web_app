// Tiny fetch wrapper around the BKafe Express API + JWT token storage.
// The base URL can be overridden with VITE_API_URL (default: local server).
const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

const TOKEN_KEY = 'bkafe_token';
let token: string | null = localStorage.getItem(TOKEN_KEY);

export function setToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}
export function getToken() {
  return token;
}

interface Options {
  method?: string;
  body?: any;
  isForm?: boolean;
}

async function request(path: string, { method = 'GET', body, isForm }: Options = {}) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: any;
  if (isForm) {
    payload = body; // FormData — let the browser set the multipart boundary
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: payload });
  } catch {
    throw new Error('Không kết nối được máy chủ. Hãy chắc chắn API đang chạy (http://localhost:5000).');
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || `Lỗi ${res.status}`);
  return data;
}

export const api = {
  get: (p: string) => request(p),
  post: (p: string, body?: any) => request(p, { method: 'POST', body }),
  put: (p: string, body?: any) => request(p, { method: 'PUT', body }),
  patch: (p: string, body?: any) => request(p, { method: 'PATCH', body }),
  del: (p: string, body?: any) => request(p, { method: 'DELETE', body }),
  postForm: (p: string, form: FormData) => request(p, { method: 'POST', body: form, isForm: true }),
  putForm: (p: string, form: FormData) => request(p, { method: 'PUT', body: form, isForm: true }),
};

export { API_URL };
