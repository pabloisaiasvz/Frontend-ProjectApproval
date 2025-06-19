const API_BASE = 'https://localhost:7096';

async function fetchJson(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, options);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}


// ---------------------- GET ----------------------

export function getAreas() {
  return fetchJson('/Api/Area');
}

export function getProjectTypes() {
  return fetchJson('/Api/ProjectType');
}

export function getRoles() {
  return fetchJson('/Api/Role');
}

export function getApprovalStatuses() {
  return fetchJson('/Api/ApprovalStatus');
}

export function getUsers() {
  return fetchJson('/Api/User');
}

export function getProjects() {
  return fetchJson('/Api/Project');
}

export function getProjectById(id) {
  return fetchJson(`/Api/Project/${id}`);
}

export function getProjectsByUser(userId) {
  return fetchJson(`/Api/Project?userId=${userId}`);
}

export function getProjectsToApprove(approverUserId) {
  return fetchJson(`/Api/Project?ApproverUserId=${approverUserId}`);
}

export function getProjectsWithFilters({ title, statusId, createdById, approverUserId } = {}) {
  const params = new URLSearchParams();
  if (title) params.append('title', title);
  if (statusId) params.append('statusId', statusId);
  if (createdById) params.append('createdById', createdById);
  if (approverUserId) params.append('ApproverUserId', approverUserId);
  return fetchJson(`/Api/Project?${params.toString()}`);
}

// ---------------------- POST ----------------------

export function createProject(data) {
  return fetchJson('/Api/Project', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

// ---------------------- PUT ----------------------

export function updateProject(id, data) {
  return fetchJson(`/Api/Project/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

// ---------------------- DECISION ----------------------


// async function fetchJsonSafe(url, options = {}) {
//   const res = await fetch(`${API_BASE}${url}`, options);
//   if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  
//   const text = await res.text();
//   return text ? JSON.parse(text) : null;
// }

export function sendProjectDecision(id, decision) {
  return fetchJson(`/Api/Project/${id}/Decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(decision)
  });
}