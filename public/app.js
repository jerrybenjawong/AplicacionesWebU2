const socket = io();
let authToken = localStorage.getItem('token') || '';
let currentUser = null;
let currentAuthMode = 'login';
let allTasks = [];
let currentFilter = 'todos';

const authOverlay = document.getElementById('authOverlay');
const workspace = document.getElementById('workspace');
const userProfile = document.getElementById('userProfile');
const userNameHeader = document.getElementById('userNameHeader');
const avatarInitial = document.getElementById('avatarInitial');
const tasksList = document.getElementById('tasksList');
const activityFeed = document.getElementById('activityFeed');

async function checkSession() {
  if (!authToken) {
    lockWorkspace();
    return;
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const json = await res.json();

    if (json.success) {
      currentUser = json.data;
      unlockWorkspace();
      loadTasks();
    } else {
      logout();
    }
  } catch (err) {
    console.error('Error verificando sesión:', err);
    logout();
  }
}

function unlockWorkspace() {
  authOverlay.style.display = 'none';
  workspace.style.display = 'block';
  userProfile.style.display = 'flex';
  userNameHeader.innerText = currentUser.nombre;
  avatarInitial.innerText = currentUser.nombre.charAt(0).toUpperCase();
}

function lockWorkspace() {
  authToken = '';
  currentUser = null;
  allTasks = [];
  localStorage.removeItem('token');

  tasksList.innerHTML = '';
  activityFeed.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
          <path d="M21 3v5h-5"/>
        </svg>
      </div>
      Inicie sesión para acceder a la auditoría en tiempo real.
    </div>
  `;
  document.getElementById('metricTotal').innerText = '0';
  document.getElementById('metricPendientes').innerText = '0';
  document.getElementById('metricProgreso').innerText = '0';
  document.getElementById('metricCompletadas').innerText = '0';

  workspace.style.display = 'none';
  userProfile.style.display = 'none';
  authOverlay.style.display = 'flex';
}

function switchAuthTab(mode) {
  currentAuthMode = mode;
  document.getElementById('tabLogin').classList.toggle('active', mode === 'login');
  document.getElementById('tabRegister').classList.toggle('active', mode === 'register');
  document.getElementById('groupNombre').style.display = mode === 'register' ? 'block' : 'none';
  document.getElementById('authSubmitBtn').innerText = mode === 'register' ? 'Crear Cuenta Institucional' : 'Acceder al Espacio de Trabajo';
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const nombre = document.getElementById('authNombre').value.trim();

  const endpoint = currentAuthMode === 'register' ? '/api/auth/register' : '/api/auth/login';
  const payload = currentAuthMode === 'register' ? { nombre, email, password } : { email, password };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();

    if (json.success) {
      authToken = json.data.token;
      localStorage.setItem('token', authToken);
      document.getElementById('authForm').reset();
      checkSession();
    } else {
      alert(`Error de autenticación: ${json.error}`);
    }
  } catch (err) {
    alert('Fallo de conexión con el backend.');
  }
}

async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (e) {}
  lockWorkspace();
}

function pushAuditLog(category, time, htmlMessage) {
  if (!authToken) return;

  const empty = activityFeed.querySelector('.empty-state');
  if (empty) empty.remove();

  const pillClasses = {
    created: 'pill-created',
    updated: 'pill-updated',
    deleted: 'pill-deleted',
    info: 'pill-info'
  };

  const pillLabels = {
    created: 'Nueva Tarea',
    updated: 'Mutación',
    deleted: 'Eliminada',
    info: 'Conexión'
  };

  const card = document.createElement('div');
  card.className = 'feed-entry';
  card.innerHTML = `
    <div class="feed-entry-header">
      <span class="feed-pill ${pillClasses[category]}">${pillLabels[category]}</span>
      <span class="feed-time">${time}</span>
    </div>
    <div class="feed-message">${htmlMessage}</div>
  `;
  activityFeed.prepend(card);
}

socket.on('system:info', (data) => {
  pushAuditLog('info', data.timestamp, `Canal dúplex establecido con el servidor.`);
});

socket.on('task:created', (data) => {
  pushAuditLog(
    'created',
    data.timestamp,
    `<strong>${data.autor}</strong> añadió la tarea <em>"${data.titulo}"</em> con prioridad <strong>${data.prioridad.toUpperCase()}</strong>.`
  );
  if (authToken) loadTasks();
});

socket.on('task:updated', (data) => {
  pushAuditLog(
    'updated',
    data.timestamp,
    `La tarea <em>"${data.titulo}"</em> pasó al estado: <strong>${data.nuevoEstado.replace('_', ' ').toUpperCase()}</strong>.`
  );
  if (authToken) loadTasks();
});

socket.on('task:deleted', (data) => {
  pushAuditLog(
    'deleted',
    data.timestamp,
    `Se eliminó la tarea <em>"${data.titulo}"</em> del clúster persistente.`
  );
  if (authToken) loadTasks();
});

async function loadTasks() {
  if (!authToken) return;

  try {
    const res = await fetch('/api/tasks', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const json = await res.json();

    if (!json.success) {
      if (res.status === 401) logout();
      return;
    }

    allTasks = json.data;
    renderTasks();
  } catch (err) {
    console.error('Error cargando tareas:', err);
  }
}

function applyFilter(filter, element) {
  currentFilter = filter;
  document.querySelectorAll('.filter-chip').forEach(el => el.classList.remove('active'));
  element.classList.add('active');
  renderTasks();
}

function renderTasks() {
  tasksList.innerHTML = '';

  let filtered = allTasks;
  if (currentFilter !== 'todos') {
    filtered = allTasks.filter(t => t.estado === currentFilter);
  }

  let total = allTasks.length;
  let pendientes = 0, enProgreso = 0, completadas = 0;

  allTasks.forEach(t => {
    if (t.estado === 'pendiente') pendientes++;
    if (t.estado === 'en_progreso') enProgreso++;
    if (t.estado === 'completada') completadas++;
  });

  document.getElementById('metricTotal').innerText = total;
  document.getElementById('metricPendientes').innerText = pendientes;
  document.getElementById('metricProgreso').innerText = enProgreso;
  document.getElementById('metricCompletadas').innerText = completadas;
  document.getElementById('taskCountBadge').innerText = `${filtered.length} de ${total} tareas`;

  if (filtered.length === 0) {
    tasksList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M9 12h6M9 16h6M9 8h6"/>
          </svg>
        </div>
        No hay tareas en la vista seleccionada.
      </div>
    `;
    return;
  }

  filtered.forEach(task => {
    let deadlineBadge = '';
    if (task.fechaLimite) {
      const fechaObj = new Date(task.fechaLimite);
      const hoy = new Date();
      const vencida = fechaObj < hoy && task.estado !== 'completada';
      const formatted = fechaObj.toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
      
      deadlineBadge = `
        <span class="tag tag-deadline ${vencida ? 'overdue' : ''}">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          ${vencida ? 'Vencida: ' : 'Vence: '} ${formatted}
        </span>
      `;
    }

    const card = document.createElement('div');
    card.className = 'task-card';
    card.innerHTML = `
      <div class="task-top">
        <span class="task-title">${task.titulo}</span>
        <span class="tag tag-${task.prioridad}">${task.prioridad}</span>
      </div>
      <p class="task-desc">${task.descripcion || 'Sin descripción técnica adicional.'}</p>

      <div class="tag-row">
        <span class="tag tag-cat">${task.categoria}</span>
        ${deadlineBadge}
        ${task.archivoAdjunto ? `
          <a href="${task.archivoAdjunto}" target="_blank" class="tag" style="background: var(--green-50); color: var(--green-600); text-decoration:none; border: 1.5px solid var(--green-100);">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Anexo
          </a>` : ''}
      </div>

      <div class="task-bottom">
        <div class="author-info">
          <div class="author-initial">${(task.autor?.nombre || 'A').charAt(0).toUpperCase()}</div>
          <span>${task.autor?.nombre || 'Anónimo'}</span>
        </div>

        <div style="display:flex; align-items:center; gap:10px;">
          <select onchange="updateTaskStatus('${task._id}', this.value)" class="form-control" style="width: auto; padding: 6px 12px; font-size: 12px; height: 34px;">
            <option value="pendiente" ${task.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
            <option value="en_progreso" ${task.estado === 'en_progreso' ? 'selected' : ''}>En Progreso</option>
            <option value="completada" ${task.estado === 'completada' ? 'selected' : ''}>Completada</option>
          </select>
          <button class="btn btn-danger-subtle" style="padding: 6px 12px; font-size: 11px; height: 34px;" onclick="deleteTask('${task._id}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    `;
    tasksList.appendChild(card);
  });
}

async function handleTaskSubmit(e) {
  e.preventDefault();
  if (!authToken) return;

  const formData = new FormData();
  formData.append('titulo', document.getElementById('taskTitulo').value);
  formData.append('descripcion', document.getElementById('taskDescripcion').value);
  formData.append('prioridad', document.getElementById('taskPrioridad').value);
  formData.append('categoria', document.getElementById('taskCategoria').value);

  const fecha = document.getElementById('taskFechaLimite').value;
  if (fecha) formData.append('fechaLimite', fecha);

  const fileInput = document.getElementById('taskArchivo');
  if (fileInput.files[0]) formData.append('archivo', fileInput.files[0]);

  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: formData
    });
    const json = await res.json();

    if (json.success) {
      document.getElementById('taskForm').reset();
    } else {
      alert(`Error al registrar tarea: ${json.error}`);
    }
  } catch (err) {
    alert('Fallo de red al registrar la tarea.');
  }
}

async function updateTaskStatus(id, estado) {
  try {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ estado })
    });
    const json = await res.json();
    if (!json.success) alert(json.error);
  } catch (err) {
    alert('Fallo al actualizar estado.');
  }
}

async function deleteTask(id) {
  if (!confirm('¿Confirma la eliminación permanente de este elemento?')) return;
  try {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const json = await res.json();
    if (!json.success) alert(json.error);
  } catch (err) {
    alert('Fallo al eliminar la tarea.');
  }
}

checkSession();
