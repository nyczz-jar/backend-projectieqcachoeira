const runtimeConfig = typeof window !== 'undefined' ? window.__IEQ_CONFIG__ : undefined;
const configuredUrl = runtimeConfig?.apiUrl || process.env.REACT_APP_API_URL || process.env.VITE_API_URL;

export const API_BASE_URL = (configuredUrl || 'https://backend-projectieqcachoeira.onrender.com').replace(/\/+$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await response.json() : null;
    const message = body?.message || body?.error;
    throw new Error(message || `A rota ${path} respondeu com HTTP ${response.status}.`);
  }

  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('application/json') ? response.json() : null;
}

function get(path) {
  return request(path);
}

function post(path, payload) {
  return request(path, { method: 'POST', body: JSON.stringify(payload) });
}

export const getMembers = () => get('/members');
export const createMember = (payload) => post('/members', payload);
export const getEvents = () => get('/events');
export const createEvent = (payload) => post('/events', payload);
export const getRecentActivities = () => get('/activities');
export const getScales = () => get('/scales');
export const getSocialCases = () => get('/social-triage');
export const updateSocialCase = (id, payload) => request(`/social-triage/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) });
export const getCourses = () => get('/courses');
export const createCourse = (payload) => post('/courses', payload);
export const getJobs = () => get('/jobs');
export const createJob = (payload) => post('/jobs', payload);
export const getFinanceSummary = () => get('/finance/summary');
