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

document.addEventListener("DOMContentLoaded", () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const userNameEl = document.getElementById("userName");
  const userEmailEl = document.getElementById("userEmail");
  const userAvatarEl = document.getElementById("userAvatar");
  const userId = currentUser?.id;

  if (currentUser) {
    if (userNameEl) userNameEl.textContent = currentUser.name;
    if (userEmailEl) userEmailEl.textContent = currentUser.email;
    if (userAvatarEl)
      userAvatarEl.textContent = currentUser.name.charAt(0).toUpperCase();
  }

  const welcomeText = document.getElementById("welcomeText");
  if (welcomeText && currentUser && currentUser.name) {
    welcomeText.textContent = `Panel principal - Bienvenido ${currentUser.name}!`;
  }

  const btnCreateProject = document.getElementById("btnCreateProject");

  btnCreateProject.addEventListener("click", (e) => {
    e.preventDefault();

    const projectModal = new bootstrap.Modal(
      document.getElementById("projectModal")
    );
    document.getElementById("projectModalTitle").textContent = "Nuevo Proyecto";
    document.getElementById("projectForm").reset();
    projectModal.show();
  });

  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");

  const projectsGrid = document.getElementById("projectsGrid");
  const emptyState = document.getElementById("emptyState");
  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const categoryFilter = document.getElementById("categoryFilter");
  const saveProjectBtn = document.getElementById("saveProjectBtn");

  const btnOwnProjects = document.getElementById("btnOwnProjects");
  const btnToApproveProjects = document.getElementById("btnToApproveProjects");

  const projectDetailsBody = document.getElementById("projectDetailsBody");
  const projectDetailsModal = new bootstrap.Modal(
    document.getElementById("projectDetailsModal")
  );
  const approvalComment = document.getElementById("approvalComment");

  let allProjects = [];
  let ownProjects = [];
  let approvalProjects = [];
  let activeProjects = [];
  let selectedProject = null;

  sidebarToggle?.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  function updateStats() {
    if (!ownProjects.length) return;

    document.getElementById("totalProjects").textContent = ownProjects.length;
    document.getElementById("pendingProjects").textContent = ownProjects.filter(
      (p) =>
        p.status.toLowerCase() === "pendiente" ||
        p.status.toLowerCase() === "pending"
    ).length;
    document.getElementById("approvedProjects").textContent =
      ownProjects.filter(
        (p) =>
          p.status.toLowerCase() === "aprobado" ||
          p.status.toLowerCase() === "approved"
      ).length;
    document.getElementById("rejectedProjects").textContent =
      ownProjects.filter(
        (p) =>
          p.status.toLowerCase() === "rechazado" ||
          p.status.toLowerCase() === "rejected"
      ).length;
  }

  async function loadSelectOptions() {
    try {
      const [areas, types] = await Promise.all([getAreas(), getProjectTypes()]);

      const areaSelect = document.getElementById("projectArea");
      const typeSelect = document.getElementById("projectType");

      if (areaSelect) {
        areaSelect.innerHTML = '<option value="">Seleccionar área</option>';
        areas.forEach((area) => {
          const option = document.createElement("option");
          option.value = area.id;
          option.textContent = area.name;
          areaSelect.appendChild(option);
        });
      }

      if (typeSelect) {
        typeSelect.innerHTML = '<option value="">Seleccionar tipo</option>';
        types.forEach((type) => {
          const option = document.createElement("option");
          option.value = type.id;
          option.textContent = type.name;
          typeSelect.appendChild(option);
        });
      }
    } catch (e) {
      console.error("Error al cargar opciones de select:", e);
    }
  }

  function categorizeProjects() {
    const userName = currentUser?.name;
    ownProjects = allProjects.filter((p) => p.applicantUserName === userName);
  }

  async function loadFilterOptions() {
    try {
      const [areas, types] = await Promise.all([getAreas(), getProjectTypes()]);

      const categoryFilter = document.getElementById("categoryFilter");
      const typeFilter = document.getElementById("typeFilter");

      if (categoryFilter) {
        categoryFilter.innerHTML = '<option value="">Todas las áreas</option>';
        areas.forEach((area) => {
          const option = document.createElement("option");
          option.value = area.name.toLowerCase();
          option.textContent = area.name;
          categoryFilter.appendChild(option);
        });
      }

      if (typeFilter) {
        typeFilter.innerHTML = '<option value="">Todos los tipos</option>';
        types.forEach((type) => {
          const option = document.createElement("option");
          option.value = type.name.toLowerCase();
          option.textContent = type.name;
          typeFilter.appendChild(option);
        });
      }
    } catch (e) {
      console.error("Error cargando opciones de filtro:", e);
    }
  }

  function renderProjects(projects) {
    const searchText = searchInput.value.toLowerCase();
    const status = statusFilter.value.toLowerCase();
    const categoryId = categoryFilter.value.toLowerCase();
    const typeId = typeFilter.value.toLowerCase();

    const filtered = projects.filter((p) => {
      const projectStatus = (p.status ?? p.statusName ?? "").toLowerCase();
      const projectArea = (p.area ?? "").toLowerCase();
      const projectType = (p.type ?? "").toLowerCase();

      const matchesSearch = p.title.toLowerCase().includes(searchText);
      const matchesStatus = !status || projectStatus === status;
      const matchesCategory = !categoryId || projectArea === categoryId;
      const matchesType = !typeId || projectType === typeId;

      return matchesSearch && matchesStatus && matchesCategory && matchesType;
    });

    const statusOrder = [
      "pendiente",
      "pending",
      "aprobado",
      "approved",
      "observado",
      "observed",
      "rechazado",
      "rejected",
    ];

    filtered.sort((a, b) => {
      const statusA = (a.status ?? a.statusName ?? "").toLowerCase();
      const statusB = (b.status ?? b.statusName ?? "").toLowerCase();

      const posA = statusOrder.indexOf(statusA);
      const posB = statusOrder.indexOf(statusB);

      return (posA === -1 ? 999 : posA) - (posB === -1 ? 999 : posB);
    });

    projectsGrid.innerHTML = "";

    if (filtered.length === 0) {
      emptyState.classList.remove("d-none");
    } else {
      emptyState.classList.add("d-none");
      filtered.forEach((p) => {
        const projectStatus = (p.status ?? p.statusName ?? "").toLowerCase();

        const card = document.createElement("div");
        card.className = "project-card card mb-3 p-3 project-clickable";
        card.style.cursor = "pointer";
        card.addEventListener("click", () => openProjectDetails(p));

        card.innerHTML = `
        <h5>${p.title}</h5>
        <p>Solicitado por: ${p.applicantUserName ?? "-"}</p>
        <small class="status-${projectStatus}">Estado: ${
          p.status ?? p.statusName ?? "-"
        }</small>
        <div>Creado el: ${new Date(p.createdAt).toLocaleDateString()}</div>
        <button class="btn btn-sm btn-outline-primary mt-2">Ver</button>
      `;

        projectsGrid.appendChild(card);
      });
    }

    updateStats();
  }

  async function openProjectDetails(project) {
    console.log("🔍 Proyecto recibido:", project);
    selectedProject = project;

    if (project.statusId === 4 && project.applicantUserId === userId) {
      return openEditProjectModal(project);
    }

    try {
      const detailed = await getProjectById(project.id);

      let stepsText = "";
      if (detailed.steps?.length > 0) {
        const currentStep = detailed.steps.find((s) => !s.decisionDate);
        stepsText = currentStep
          ? `<p><strong>Paso actual:</strong> ${currentStep.stepOrder} - ${currentStep.approverRole.name}</p>`
          : "";
      }

      let observationsText = "";
      const isOwnProject = project.applicantUserId === userId;

      if (isOwnProject && detailed.steps?.length > 0) {
        const previousObservations = detailed.steps
          .filter((s) => s.observations)
          .map(
            (s) =>
              `<li><strong>${s.approverRole.name}:</strong> ${s.observations}</li>`
          )
          .join("");

        if (previousObservations) {
          observationsText = `
          <div class="mt-2">
            <strong>Comentarios del evaluador:</strong>
            <ul>${previousObservations}</ul>
          </div>
        `;
        }
      }

      projectDetailsBody.innerHTML = `
      <p><strong>ID:</strong> ${detailed.id}</p>
      <p><strong>Nombre:</strong> ${detailed.title}</p>
      <p><strong>Descripción:</strong> ${detailed.description || "-"}</p>
      <p><strong>Estado:</strong> <span class="badge-status status-${
        detailed.status?.name
      }">${detailed.status?.name ?? "-"}</span></p>
      <p><strong>Área:</strong> ${detailed.area?.name ?? "-"}</p>
      <p><strong>Tipo:</strong> ${detailed.projectType?.name ?? "-"}</p>
      <p><strong>Monto estimado:</strong> $${detailed.amount}</p>
      <p><strong>Duración estimada:</strong> ${detailed.duration} días</p>
      <p><strong>Creado el:</strong> ${new Date(
        project.createdAt
      ).toLocaleDateString()}</p>
      ${stepsText}
      ${observationsText}
    `;

      const modalFooter = document.querySelector(".modal-footer");
      const projectFinalized = [2, 3, 4].includes(detailed.status?.id);

      if (modalFooter) {
        if (isOwnProject || projectFinalized) {
          modalFooter.style.display = "none";
          approvalComment.disabled = true;
        } else {
          modalFooter.style.display = "flex";
          approvalComment.disabled = false;
        }
      } else {
        console.error(
          "ERROR: No se encontró el elemento con la clase '.modal-footer'."
        );
      }
    } catch (e) {
      console.error("Error al obtener detalles del proyecto:", e);
      projectDetailsBody.innerHTML =
        "<p>Error al cargar los detalles del proyecto.</p>";

      const modalFooter = document.querySelector(".modal-footer");
      if (modalFooter) {
        modalFooter.style.display = "none";
        approvalComment.disabled = true;
      }
    }

    approvalComment.value = "";
    projectDetailsModal.show();
  }

  async function openEditProjectModal(project) {
    try {
      const detailed = await getProjectById(project.id);

      document.getElementById("projectModalTitle").textContent =
        "Editar Proyecto Observado";
      const form = document.getElementById("projectForm");

      form.reset();
      document.getElementById("projectTitle").value = detailed.title;
      document.getElementById("projectDescription").value =
        detailed.description || "";
      document.getElementById("projectArea").value = detailed.area?.id || "";
      document.getElementById("projectType").value =
        detailed.projectType?.id || "";
      document.getElementById("projectBudget").value = detailed.amount || "";
      document.getElementById("projectDuration").value =
        detailed.duration || "";

      form.dataset.editingProjectId = detailed.id;

      const projectModal = new bootstrap.Modal(
        document.getElementById("projectModal")
      );
      projectModal.show();
    } catch (e) {
      alert("Error al cargar proyecto para edición.");
      console.error(e);
    }
  }

  async function handleProjectDecision(status, errorMessage) {
    if (!selectedProject) return;

    try {
      await sendProjectDecision(selectedProject.id, {
        approverUserId: userId,
        status,
        observation: approvalComment.value,
      });
      await loadProjects();
      projectDetailsModal.hide();
    } catch (error) {
      alert(errorMessage);
      console.error(errorMessage, error);
    }
  }

  window.approveProject = () =>
    handleProjectDecision(
      2,
      "⚠️ No se pudo aprobar el proyecto. Verificá su estado."
    );
  window.rejectProject = () =>
    handleProjectDecision(
      3,
      "⚠️ No se pudo rechazar el proyecto. Verificá su estado."
    );
  window.observeProject = () =>
    handleProjectDecision(
      4,
      "⚠️ No se pudo observar el proyecto. Verificá su estado."
    );

  searchInput.addEventListener("input", () => renderProjects(activeProjects));
  statusFilter.addEventListener("change", () => renderProjects(activeProjects));
  typeFilter.addEventListener("change", () => renderProjects(activeProjects));
  categoryFilter.addEventListener("change", () =>
    renderProjects(activeProjects)
  );

  btnOwnProjects.addEventListener("click", () => {
    btnOwnProjects.classList.add("active");
    btnToApproveProjects.classList.remove("active");
    activeProjects = ownProjects;
    renderProjects(activeProjects);
  });

  btnToApproveProjects.addEventListener("click", () => {
    btnOwnProjects.classList.remove("active");
    btnToApproveProjects.classList.add("active");
    activeProjects = approvalProjects;
    renderProjects(activeProjects);
  });

  window.openNewProjectModal = function () {
    const projectModal = new bootstrap.Modal(
      document.getElementById("projectModal")
    );
    document.getElementById("projectModalTitle").textContent = "Nuevo Proyecto";
    document.getElementById("projectForm").reset();
    projectModal.show();
  };

  saveProjectBtn.addEventListener("click", async () => {
    const title = document.getElementById("projectTitle").value.trim();
    const description = document
      .getElementById("projectDescription")
      .value.trim();
    const areaId = parseInt(document.getElementById("projectArea").value);
    const typeId = parseInt(document.getElementById("projectType").value);
    const estimatedAmount = parseFloat(
      document.getElementById("projectBudget").value
    );
    const estimatedDuration = parseInt(
      document.getElementById("projectDuration").value
    );

    if (
      !title ||
      isNaN(areaId) ||
      isNaN(typeId) ||
      isNaN(estimatedAmount) ||
      isNaN(estimatedDuration)
    ) {
      alert("Por favor, completá todos los campos correctamente.");
      return;
    }

    const isEditing = !!selectedProject;
    const statusId = isEditing ? 1 : 1;

    const projectData = {
      title,
      description,
      areaId,
      typeId,
      estimatedAmount,
      estimatedDuration,
      statusId,
      createById: userId,
    };

    try {
      if (isEditing) {
        await updateProject(selectedProject.id, projectData);
      } else {
        await createProject(projectData);
      }
      bootstrap.Modal.getInstance(
        document.getElementById("projectModal")
      ).hide();
      loadProjects();
    } catch (e) {
      console.error("Error al guardar proyecto:", e);
      alert("Hubo un error al guardar el proyecto.");
    }
  });

  window.logout = function () {
    localStorage.removeItem("currentUser");
    window.location.href = "/views/login.html";
  };

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
      btnOwnProjects.classList.add("active");
      btnToApproveProjects.classList.remove("active");
      renderProjects(activeProjects);
    } catch (e) {}
  }

  loadSelectOptions().then(() => {
    loadProjects();
    loadFilterOptions();
  });
});
