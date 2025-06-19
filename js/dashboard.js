import {
  getAreas,
  getProjectTypes,
  createProject,
  updateProject,
  sendProjectDecision,
  getProjectsByUser,
  getProjectById,
  getProjectsToApprove,
} from "./api.js";

import { 
  getCurrentUser, 
  logout, 
  filterAndSortProjects, 
  calculateStats,
  DECISION_TYPES 
} from "./utils.js";

import { UI } from "./ui.js";
import { ProjectModal, ProjectDetailsModal } from "./modals.js";

document.addEventListener("DOMContentLoaded", () => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = "/views/login.html";
    return;
  }

  const ui = new UI();
  const projectModal = new ProjectModal();
  const projectDetailsModal = new ProjectDetailsModal();

  let allProjects = [];
  let ownProjects = [];
  let approvalProjects = [];
  let activeProjects = [];
  const userId = currentUser.id;

  ui.updateUserInfo(currentUser);

  // ===== EVENT LISTENERS =====
  
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");
  sidebarToggle?.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  const btnCreateProject = document.getElementById("btnCreateProject");
  const btnOwnProjects = document.getElementById("btnOwnProjects");
  const btnToApproveProjects = document.getElementById("btnToApproveProjects");
  const saveProjectBtn = document.getElementById("saveProjectBtn");

  btnCreateProject?.addEventListener("click", (e) => {
    e.preventDefault();
    projectModal.showNew();
  });

  btnOwnProjects?.addEventListener("click", () => switchTab('own'));
  btnToApproveProjects?.addEventListener("click", () => switchTab('approval'));

  ui.elements.searchInput?.addEventListener("input", renderActiveProjects);
  ui.elements.statusFilter?.addEventListener("change", renderActiveProjects);
  ui.elements.categoryFilter?.addEventListener("change", renderActiveProjects);
  ui.elements.typeFilter?.addEventListener("change", renderActiveProjects);

  saveProjectBtn?.addEventListener("click", handleSaveProject);

  window.approveProject = () => handleProjectDecision(DECISION_TYPES.APPROVE);
  window.rejectProject = () => handleProjectDecision(DECISION_TYPES.REJECT);
  window.observeProject = () => handleProjectDecision(DECISION_TYPES.OBSERVE);
  window.logout = logout;
  window.openNewProjectModal = () => projectModal.showNew();

  // ===== FUNCIONES PRINCIPALES =====

  function switchTab(tab) {
    if (tab === 'own') {
      btnOwnProjects.classList.add("active");
      btnToApproveProjects.classList.remove("active");
      activeProjects = ownProjects;
    } else {
      btnOwnProjects.classList.remove("active");
      btnToApproveProjects.classList.add("active");
      activeProjects = approvalProjects;
    }
    renderActiveProjects();
  }

  function renderActiveProjects() {
    const filters = ui.getFilterValues();
    const filteredProjects = filterAndSortProjects(activeProjects, filters);
    
    ui.renderProjects(filteredProjects, openProjectDetails);
    
    if (activeProjects === ownProjects) {
      const stats = calculateStats(ownProjects);
      ui.updateStats(stats);
    }
  }

  async function openProjectDetails(project) {
    console.log("🔍 Proyecto recibido:", project);

    if (project.statusId === 4 && project.applicantUserId === userId) {
      try {
        const detailed = await getProjectById(project.id);
        projectModal.showEdit(detailed);
      } catch (error) {
        alert("Error al cargar proyecto para edición.");
        console.error(error);
      }
      return;
    }

    // Mostrar detalles del proyecto
    try {
      const detailed = await getProjectById(project.id);
      projectDetailsModal.show(project, detailed, userId);
    } catch (error) {
      console.error("Error al obtener detalles del proyecto:", error);
      projectDetailsModal.showError();
    }
  }

  async function handleSaveProject() {
    const formData = projectModal.getFormData();
    
    if (!projectModal.validateForm(formData)) {
      alert("Por favor, completá todos los campos correctamente.");
      return;
    }

    const projectData = {
      ...formData,
      statusId: 1,
      createById: userId
    };

    try {
      if (projectModal.isEditing()) {
        await updateProject(projectModal.selectedProject.id, projectData);
      } else {
        await createProject(projectData);
      }
      
      projectModal.hide();
      await loadProjects();
    } catch (error) {
      console.error("Error al guardar proyecto:", error);
      alert("Hubo un error al guardar el proyecto.");
    }
  }

  async function handleProjectDecision(status) {
    const selectedProject = projectDetailsModal.getSelectedProject();
    if (!selectedProject) return;

    const errorMessages = {
      [DECISION_TYPES.APPROVE]: "⚠️ No se pudo aprobar el proyecto. Verificá su estado.",
      [DECISION_TYPES.REJECT]: "⚠️ No se pudo rechazar el proyecto. Verificá su estado.",
      [DECISION_TYPES.OBSERVE]: "⚠️ No se pudo observar el proyecto. Verificá su estado."
    };

    try {
      await sendProjectDecision(selectedProject.id, {
        approverUserId: userId,
        status,
        observation: projectDetailsModal.getComment()
      });
      
      await loadProjects();
      projectDetailsModal.hide();
    } catch (error) {
      alert(errorMessages[status]);
      console.error(errorMessages[status], error);
    }
  }

  async function loadSelectOptions() {
    try {
      const [areas, types] = await Promise.all([getAreas(), getProjectTypes()]);
      
      ui.populateSelectOptions("projectArea", areas, "Seleccionar área");
      ui.populateSelectOptions("projectType", types, "Seleccionar tipo");
    } catch (error) {
      console.error("Error al cargar opciones de select:", error);
    }
  }

  async function loadFilterOptions() {
    try {
      const [areas, types] = await Promise.all([getAreas(), getProjectTypes()]);
      
      ui.populateSelectOptions("categoryFilter", areas.map(a => ({...a, id: a.name.toLowerCase()})), "Todas las áreas");
      ui.populateSelectOptions("typeFilter", types.map(t => ({...t, id: t.name.toLowerCase()})), "Todos los tipos");
    } catch (error) {
      console.error("Error cargando opciones de filtro:", error);
    }
  }

  function categorizeProjects() {
    ownProjects = allProjects.filter(p => p.applicantUserName === currentUser.name);
  }

  async function loadProjects() {
    try {
      console.log("🔍 Cargando proyectos para userId:", userId);

      allProjects = await getProjectsByUser(userId);
      categorizeProjects();

      approvalProjects = await getProjectsToApprove(userId);
      approvalProjects.sort((a, b) => {
        if (a.statusId === 1 && b.statusId !== 1) return -1;
        if (a.statusId !== 1 && b.statusId === 1) return 1;
        return 0;
      });

      activeProjects = ownProjects;
      switchTab('own');
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  }

  // ===== INICIALIZACIÓN =====
  async function init() {
    try {
      await loadSelectOptions();
      await loadProjects();
      await loadFilterOptions();
    } catch (error) {
      console.error("Error inicializando dashboard:", error);
    }
  }

  init();
});