import {
  getProjects,
  getAreas,
  getProjectTypes,
  createProject,
  updateProject,
  sendProjectDecision,
  getProjectsByUser
} from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  function getStatusName(statusId) {
    switch (statusId) {
      case 1: return 'Pendiente';
      case 2: return 'Aprobado';
      case 3: return 'Rechazado';
      case 4: return 'Observado';
      default: return 'Desconocido';
    }
  }

  const userNameEl = document.getElementById('userName');
  const userEmailEl = document.getElementById('userEmail');
  const userAvatarEl = document.getElementById('userAvatar');
  const userId = currentUser?.id;

  if (currentUser) {
    if (userNameEl) userNameEl.textContent = currentUser.name;
    if (userEmailEl) userEmailEl.textContent = currentUser.email;
    if (userAvatarEl) userAvatarEl.textContent = currentUser.name.charAt(0).toUpperCase();
  }

  const welcomeText = document.getElementById('welcomeText');
  if (welcomeText && currentUser && currentUser.name) {
    welcomeText.textContent = `Panel principal - Bienvenido ${currentUser.name}!`;
  }

  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');

  const projectsGrid = document.getElementById('projectsGrid');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const categoryFilter = document.getElementById('categoryFilter');
  const saveProjectBtn = document.getElementById('saveProjectBtn');

  const totalProjectsEl = document.getElementById('totalProjects');
  const pendingProjectsEl = document.getElementById('pendingProjects');
  const approvedProjectsEl = document.getElementById('approvedProjects');
  const rejectedProjectsEl = document.getElementById('rejectedProjects');

  const btnOwnProjects = document.getElementById('btnOwnProjects');
  const btnToApproveProjects = document.getElementById('btnToApproveProjects');

  const projectDetailsBody = document.getElementById('projectDetailsBody');
  const projectDetailsModal = new bootstrap.Modal(document.getElementById('projectDetailsModal'));
  const approvalComment = document.getElementById('approvalComment');

  let allProjects = [];
  let ownProjects = [];
  let approvalProjects = [];
  let activeProjects = [];
  let selectedProject = null;

  sidebarToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  async function loadSelectOptions() {
    try {
      const [areas, types] = await Promise.all([getAreas(), getProjectTypes()]);

      const areaSelect = document.getElementById('projectArea');
      const typeSelect = document.getElementById('projectType');

      if (areaSelect) {
        areaSelect.innerHTML = '<option value="">Seleccionar área</option>';
        areas.forEach(area => {
          const option = document.createElement('option');
          option.value = area.id;
          option.textContent = area.name;
          areaSelect.appendChild(option);
        });
      }

      if (typeSelect) {
        typeSelect.innerHTML = '<option value="">Seleccionar tipo</option>';
        types.forEach(type => {
          const option = document.createElement('option');
          option.value = type.id;
          option.textContent = type.name;
          typeSelect.appendChild(option);
        });
      }
    } catch (e) {
      console.error('Error al cargar opciones de select:', e);
    }
  }

  function categorizeProjects() {
    const userName = currentUser?.name;
    ownProjects = allProjects.filter(p => p.applicantUserName === userName);
    approvalProjects = allProjects.filter(p => p.statusId === 1 && p.applicantUserName !== userName); // pendiente = 1
  }

  function renderProjects(projects) {
    const searchText = searchInput.value.toLowerCase();
    const status = statusFilter.value.toLowerCase();

    const filtered = projects.filter(p => {
      return (
        p.title.toLowerCase().includes(searchText) &&
        (status === '' || getStatusName(p.statusId).toLowerCase() === status)
      );
    });

    projectsGrid.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.classList.remove('d-none');
    } else {
      emptyState.classList.add('d-none');
      filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'project-card card mb-3 p-3 project-clickable';
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => openProjectDetails(p));

        card.innerHTML = `
          <h5>${p.title}</h5>
          <p>Solicitado por: ${p.applicantUserName ?? '-'}</p>
          <small>Estado: ${getStatusName(p.statusId)}</small>
          <div>Creado el: ${new Date(p.createdAt).toLocaleDateString()}</div>
          <button class="btn btn-sm btn-outline-primary mt-2">Ver</button>
        `;
        projectsGrid.appendChild(card);
      });
    }

    updateStats();
  }

function updateStats() {
  console.log('ownProjects:', ownProjects);
  if (!ownProjects.length) return;

  document.getElementById('totalProjects').textContent = ownProjects.length;
  document.getElementById('pendingProjects').textContent = ownProjects.filter(p => p.statusId === 1).length;
  document.getElementById('approvedProjects').textContent = ownProjects.filter(p => p.statusId === 2).length;
  document.getElementById('rejectedProjects').textContent = ownProjects.filter(p => p.statusId === 3).length;
}


  function openProjectDetails(project) {
    selectedProject = project;
    projectDetailsBody.innerHTML = `
      <p><strong>Nombre:</strong> ${project.title}</p>
      <p><strong>Estado:</strong> ${getStatusName(project.statusId)}</p>
      <p><strong>Solicitante:</strong> ${project.applicantUserName ?? '-'}</p>
      <p><strong>Creado el:</strong> ${new Date(project.createdAt).toLocaleDateString()}</p>
    `;

    const isApprovable = approvalProjects.includes(project);
    document.querySelector('.modal-footer').style.display = isApprovable ? 'flex' : 'none';

    approvalComment.value = '';
    projectDetailsModal.show();
  }

  window.approveProject = async function () {
    if (!selectedProject) return;
    await sendProjectDecision(selectedProject.id, {
      status: 'aprobado',
      comment: approvalComment.value
    });
    await loadProjects();
    projectDetailsModal.hide();
  };

  window.rejectProject = async function () {
    if (!selectedProject) return;
    await sendProjectDecision(selectedProject.id, {
      status: 'rechazado',
      comment: approvalComment.value
    });
    await loadProjects();
    projectDetailsModal.hide();
  };

  window.observeProject = async function () {
    if (!selectedProject) return;
    await sendProjectDecision(selectedProject.id, {
      status: 'observado',
      comment: approvalComment.value
    });
    await loadProjects();
    projectDetailsModal.hide();
  };

  searchInput.addEventListener('input', () => renderProjects(activeProjects));
  statusFilter.addEventListener('change', () => renderProjects(activeProjects));

  btnOwnProjects.addEventListener('click', () => {
    btnOwnProjects.classList.add('active');
    btnToApproveProjects.classList.remove('active');
    activeProjects = ownProjects;
    renderProjects(activeProjects);
  });

  btnToApproveProjects.addEventListener('click', () => {
    btnOwnProjects.classList.remove('active');
    btnToApproveProjects.classList.add('active');
    activeProjects = approvalProjects;
    renderProjects(activeProjects);
  });

  window.openNewProjectModal = function () {
    const projectModal = new bootstrap.Modal(document.getElementById('projectModal'));
    document.getElementById('projectModalTitle').textContent = 'Nuevo Proyecto';
    document.getElementById('projectForm').reset();
    projectModal.show();
  };

  saveProjectBtn.addEventListener('click', async () => {
    const title = document.getElementById('projectTitle').value.trim();
    const description = document.getElementById('projectDescription').value.trim();
    const areaId = parseInt(document.getElementById('projectArea').value);
    const typeId = parseInt(document.getElementById('projectType').value);
    const estimatedAmount = parseFloat(document.getElementById('projectBudget').value);
    const estimatedDuration = parseInt(document.getElementById('projectDuration').value);
    const user = JSON.parse(localStorage.getItem('currentUser'));

    if (!title || !description || isNaN(areaId) || isNaN(typeId) || isNaN(estimatedAmount) || isNaN(estimatedDuration)) {
      alert('Por favor, completá todos los campos correctamente.');
      return;
    }

    const projectData = {
      title,
      description,
      areaId,
      typeId,
      estimatedAmount,
      estimatedDuration,
      createById: user.id
    };

    try {
      await createProject(projectData);
      bootstrap.Modal.getInstance(document.getElementById('projectModal')).hide();
      loadProjects();
    } catch (e) {
      console.error('Error al crear proyecto:', e);
      alert('Hubo un error al crear el proyecto.');
    }
  });

  window.logout = function () {
    localStorage.removeItem('currentUser');
    window.location.href = '/views/login.html';
  };

  async function loadProjects() {
    try {
      allProjects = await getProjectsByUser(userId);
      categorizeProjects();
      activeProjects = ownProjects;
      btnOwnProjects.classList.add('active');
      btnToApproveProjects.classList.remove('active');
      renderProjects(activeProjects);
    } catch (e) {
      console.error('Error al cargar proyectos:', e);
    }
  }

  loadSelectOptions().then(() => {
    loadProjects();
  });
});
