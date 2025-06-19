export class ProjectModal {
  constructor() {
    this.modal = null;
    this.form = document.getElementById("projectForm");
    this.titleElement = document.getElementById("projectModalTitle");
    this.selectedProject = null;
  }

  showNew() {
    this.modal = new bootstrap.Modal(document.getElementById("projectModal"));
    this.titleElement.textContent = "Nuevo Proyecto";
    this.form.reset();
    delete this.form.dataset.editingProjectId;
    this.selectedProject = null;
    this.modal.show();
  }

  showEdit(project) {
    this.modal = new bootstrap.Modal(document.getElementById("projectModal"));
    this.titleElement.textContent = "Editar Proyecto Observado";
    this.selectedProject = project;
    
    document.getElementById("projectTitle").value = project.title;
    document.getElementById("projectDescription").value = project.description || "";
    document.getElementById("projectArea").value = project.area?.id || "";
    document.getElementById("projectType").value = project.projectType?.id || "";
    document.getElementById("projectBudget").value = project.amount || "";
    document.getElementById("projectDuration").value = project.duration || "";
    
    this.form.dataset.editingProjectId = project.id;
    this.modal.show();
  }

  hide() {
    if (this.modal) {
      this.modal.hide();
    }
  }

  getFormData() {
    return {
      title: document.getElementById("projectTitle").value.trim(),
      description: document.getElementById("projectDescription").value.trim(),
      areaId: parseInt(document.getElementById("projectArea").value),
      typeId: parseInt(document.getElementById("projectType").value),
      estimatedAmount: parseFloat(document.getElementById("projectBudget").value),
      estimatedDuration: parseInt(document.getElementById("projectDuration").value)
    };
  }

  isEditing() {
    return !!this.form.dataset.editingProjectId;
  }

  validateForm(formData) {
    const { title, areaId, typeId, estimatedAmount, estimatedDuration } = formData;
    return title && !isNaN(areaId) && !isNaN(typeId) && !isNaN(estimatedAmount) && !isNaN(estimatedDuration);
  }
}

export class ProjectDetailsModal {
  constructor() {
    this.modal = new bootstrap.Modal(document.getElementById("projectDetailsModal"));
    this.bodyElement = document.getElementById("projectDetailsBody");
    this.commentElement = document.getElementById("approvalComment");
    this.selectedProject = null;
  }

  show(project, detailedProject, userId) {
    this.selectedProject = project;

    const stepsText = this.generateStepsText(detailedProject.steps);
    const observationsText = this.generateObservationsText(detailedProject.steps, project, userId);
    
    this.bodyElement.innerHTML = `
      <p><strong>ID:</strong> ${detailedProject.id}</p>
      <p><strong>Nombre:</strong> ${detailedProject.title}</p>
      <p><strong>Descripción:</strong> ${detailedProject.description || "-"}</p>
      <p><strong>Estado:</strong> <span class="badge-status status-${detailedProject.status?.name}">${detailedProject.status?.name ?? "-"}</span></p>
      <p><strong>Área:</strong> ${detailedProject.area?.name ?? "-"}</p>
      <p><strong>Tipo:</strong> ${detailedProject.projectType?.name ?? "-"}</p>
      <p><strong>Monto estimado:</strong> $${detailedProject.amount}</p>
      <p><strong>Duración estimada:</strong> ${detailedProject.duration} días</p>
      <p><strong>Creado el:</strong> ${new Date(project.createdAt).toLocaleDateString()}</p>
      ${stepsText}
      ${observationsText}
    `;

    this.configureModalFooter(detailedProject, project, userId);
    this.commentElement.value = "";
    this.modal.show();
  }

  generateStepsText(steps) {
    if (!steps?.length) return "";
    
    const currentStep = steps.find(s => !s.decisionDate);
    return currentStep 
      ? `<p><strong>Paso actual:</strong> ${currentStep.stepOrder} - ${currentStep.approverRole.name}</p>`
      : "";
  }

  generateObservationsText(steps, project, userId) {
    const isOwnProject = project.applicantUserId === userId;
    
    if (!isOwnProject || !steps?.length) return "";

    const previousObservations = steps
      .filter(s => s.observations)
      .map(s => `<li><strong>${s.approverRole.name}:</strong> ${s.observations}</li>`)
      .join("");

    return previousObservations 
      ? `<div class="mt-2"><strong>Comentarios del evaluador:</strong><ul>${previousObservations}</ul></div>`
      : "";
  }

  configureModalFooter(detailedProject, project, userId) {
    const modalFooter = document.querySelector(".modal-footer");
    const projectFinalized = [2, 3, 4].includes(detailedProject.status?.id);
    const isOwnProject = project.applicantUserId === userId;

    if (modalFooter) {
      if (isOwnProject || projectFinalized) {
        modalFooter.style.display = "none";
        this.commentElement.disabled = true;
      } else {
        modalFooter.style.display = "flex";
        this.commentElement.disabled = false;
      }
    }
  }

  showError() {
    this.bodyElement.innerHTML = "<p>Error al cargar los detalles del proyecto.</p>";
    const modalFooter = document.querySelector(".modal-footer");
    if (modalFooter) {
      modalFooter.style.display = "none";
      this.commentElement.disabled = true;
    }
    this.modal.show();
  }

  hide() {
    this.modal.hide();
  }

  getSelectedProject() {
    return this.selectedProject;
  }

  getComment() {
    return this.commentElement.value;
  }
}