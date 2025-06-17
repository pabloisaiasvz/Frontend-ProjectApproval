import { getUsers } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loadingOverlay = document.getElementById('loadingOverlay');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById('email').value.trim();

    if (emailInput === '') {
      alert('Por favor ingresa un email');
      return;
    }

    loadingOverlay.style.display = 'flex';

    try {
      const users = await getUsers();
      const user = users.find(u => u.email.toLowerCase() === emailInput.toLowerCase());

      if (!user) {
        loadingOverlay.style.display = 'none';
        alert('Usuario no encontrado');
        return;
      }

      localStorage.setItem('currentUser', JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.role.id,
        roleName: user.role.name
      }));

      window.location.href = 'dashboard.html';
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      alert('Ocurrió un error al iniciar sesión');
    } finally {
      loadingOverlay.style.display = 'none';
    }
  });
});
