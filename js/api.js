const API_BASE = 'https://localhost:7096';

async function fetchJson(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, options);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
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

export function sendProjectDecision(id, decision) {
  return fetchJson(`/Api/Project/${id}/Decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(decision)
  });
}
