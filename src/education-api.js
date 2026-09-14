const prefix = '/app-api/edu';

export async function educationRequest(path, { signal, body, ...options } = {}) {
  const response = await fetch(prefix + path, {
    ...options, signal: signal || AbortSignal.timeout(20000),
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || result.code !== 0) {
    const error = new Error(result?.msg || '暂时无法连接，请稍后重试。');
    error.code = result?.code || response.status;
    throw error;
  }
  return result.data;
}
export const getWebsiteOfferings = options => educationRequest('/website-offering/list', options);
export const getAdmissionOptions = options => educationRequest('/website-admission/options', options);
export const submitAdmission = body => educationRequest('/website-admission/create', { method: 'POST', body });
export const getCourseDetail = id => educationRequest('/course/get?id=' + encodeURIComponent(id));
export const getCoursePage = params => educationRequest('/course/page?' + new URLSearchParams(params));
export const getBrand = options => educationRequest('/config/get', options);
export const getTeachers = options => educationRequest('/teacher/list', options);

/** Keep only a digest and random retry token, never contact information, in session storage. */
export async function submissionIdentity(payload) {
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload)))))
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
  const key = 'vibe-admission-request:' + digest;
  let requestId;
  try { requestId = sessionStorage.getItem(key); } catch { /* memory fallback below */ }
  requestId ||= crypto.randomUUID();
  try { sessionStorage.setItem(key, requestId); } catch { /* the form also retains its current request */ }
  return { key, requestId };
}
