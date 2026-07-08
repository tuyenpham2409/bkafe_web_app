import { env } from '../config/env.js';

async function request(path, options = {}, req = null) {
  const url = `${env.apiUrl}${path}`;
  const headers = { ...options.headers };

  // Forward authorization token if available in cookies
  if (req && req.cookies && req.cookies.bkafe_token) {
    headers['Authorization'] = `Bearer ${req.cookies.bkafe_token}`;
  }

  // Automatically parse body as JSON if not sending FormData
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMsg = data?.message || `API error ${response.status}: ${response.statusText}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (path, req) => request(path, { method: 'GET' }, req),
  post: (path, body, req) => request(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }, req),
  put: (path, body, req) => request(path, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) }, req),
  patch: (path, body, req) => request(path, { method: 'PATCH', body: body instanceof FormData ? body : JSON.stringify(body) }, req),
  del: (path, body, req) => request(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }, req),
};
