export const PROJECT_STATUS_ORDER = [
  'pendiente', 'pending', 'aprobado', 'approved', 
  'observado', 'observed', 'rechazado', 'rejected'
];

export const DECISION_TYPES = {
  APPROVE: 2,
  REJECT: 3,
  OBSERVE: 4
};

export function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

export function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "/views/login.html";
}

export function filterAndSortProjects(projects, filters) {
  const { searchText, status, categoryId, typeId } = filters;

  const filtered = projects.filter(project => {
    const projectStatus = (project.status ?? project.statusName ?? "").toLowerCase();
    const projectArea = (project.area ?? "").toLowerCase();
    const projectType = (project.type ?? "").toLowerCase();

    const matchesSearch = project.title.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = !status || projectStatus === status;
    const matchesCategory = !categoryId || projectArea === categoryId;
    const matchesType = !typeId || projectType === typeId;

    return matchesSearch && matchesStatus && matchesCategory && matchesType;
  });

  return filtered.sort((a, b) => {
    const statusA = (a.status ?? a.statusName ?? "").toLowerCase();
    const statusB = (b.status ?? b.statusName ?? "").toLowerCase();

    const posA = PROJECT_STATUS_ORDER.indexOf(statusA);
    const posB = PROJECT_STATUS_ORDER.indexOf(statusB);

    return (posA === -1 ? 999 : posA) - (posB === -1 ? 999 : posB);
  });
}

export function calculateStats(projects) {
  return {
    total: projects.length,
    pending: projects.filter(p => 
      ['pendiente', 'pending'].includes((p.status ?? p.statusName ?? "").toLowerCase())
    ).length,
    approved: projects.filter(p => 
      ['aprobado', 'approved'].includes((p.status ?? p.statusName ?? "").toLowerCase())
    ).length,
    rejected: projects.filter(p => 
      ['rechazado', 'rejected'].includes((p.status ?? p.statusName ?? "").toLowerCase())
    ).length
  };
}