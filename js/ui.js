export class UI {
  constructor() {
    this.elements = {
      userNameEl: document.getElementById("userName"),
      userEmailEl: document.getElementById("userEmail"),
      userAvatarEl: document.getElementById("userAvatar"),
      welcomeText: document.getElementById("welcomeText"),
      projectsGrid: document.getElementById("projectsGrid"),
      emptyState: document.getElementById("emptyState"),
      searchInput: document.getElementById("searchInput"),
      statusFilter: document.getElementById("statusFilter"),
      categoryFilter: document.getElementById("categoryFilter"),
      typeFilter: document.getElementById("typeFilter"),
      totalProjects: document.getElementById("totalProjects"),
      pendingProjects: document.getElementById("pendingProjects"),
      approvedProjects: document.getElementById("approvedProjects"),
      rejectedProjects: document.getElementById("rejectedProjects")
    };
  }

  updateUserInfo(user) {
    if (this.elements.userNameEl) this.elements.userNameEl.textContent = user.name;
    if (this.elements.userEmailEl) this.elements.userEmailEl.textContent = user.email;
    if (this.elements.userAvatarEl) this.elements.userAvatarEl.textContent = user.name.charAt(0).toUpperCase();
    if (this.elements.welcomeText) {
      this.elements.welcomeText.textContent = `Bienvenid@ ${user.name}! - Panel principal / ${user.roleName}`;
    }
  }

  updateStats(stats) {
    if (this.elements.totalProjects) this.elements.totalProjects.textContent = stats.total;
    if (this.elements.pendingProjects) this.elements.pendingProjects.textContent = stats.pending;
    if (this.elements.approvedProjects) this.elements.approvedProjects.textContent = stats.approved;
    if (this.elements.rejectedProjects) this.elements.rejectedProjects.textContent = stats.rejected;
  }

  getFilterValues() {
    return {
      searchText: this.elements.searchInput?.value.toLowerCase() || '',
      status: this.elements.statusFilter?.value.toLowerCase() || '',
      categoryId: this.elements.categoryFilter?.value.toLowerCase() || '',
      typeId: this.elements.typeFilter?.value.toLowerCase() || ''
    };
  }

  renderProjects(projects, onProjectClick) {
    this.elements.projectsGrid.innerHTML = "";

    if (projects.length === 0) {
      this.elements.emptyState?.classList.remove("d-none");
      return;
    }

    this.elements.emptyState?.classList.add("d-none");
    
    projects.forEach(project => {
      const projectStatus = (project.status ?? project.statusName ?? "").toLowerCase();
      const card = document.createElement("div");
      card.className = "project-card card mb-3 p-3 project-clickable";
      card.style.cursor = "pointer";
      card.addEventListener("click", () => onProjectClick(project));

      card.innerHTML = `
        <h5>${project.title}</h5>
        <p>Solicitado por: ${project.applicantUserName ?? "-"}</p>
        <small class="status-${projectStatus}">Estado: ${project.status ?? project.statusName ?? "-"}</small>
        <div>Creado el: ${new Date(project.createdAt).toLocaleDateString()}</div>
        <button class="btn btn-sm btn-outline-primary mt-2">Ver</button>
      `;

      this.elements.projectsGrid.appendChild(card);
    });
  }

  populateSelectOptions(elementId, options, defaultText) {
    const select = document.getElementById(elementId);
    if (!select) return;

    select.innerHTML = `<option value="">${defaultText}</option>`;
    options.forEach(option => {
      const optionElement = document.createElement("option");
      optionElement.value = option.id || option.name.toLowerCase();
      optionElement.textContent = option.name;
      select.appendChild(optionElement);
    });
  }
}