async function loadEmployees() {
  const res = await fetch('/api/admin/employees');
  if (!res.ok) return location.href = '/';
  const data = await res.json();
  const tbody = document.getElementById('empRows');
  if (!tbody) return;
  tbody.innerHTML = '';
  data.rows.forEach(e => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">${e.employee_id}</code></td>
      <td><span style="font-weight: 600;">${e.name}</span></td>
      <td>${e.department}</td>
      <td><span style="color: var(--text-muted);">${e.designation}</span></td>
      <td><a href="mailto:${e.email}" style="color: var(--primary); text-decoration: none;">${e.email}</a></td>
      <td style="font-family: monospace;">${e.phone}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function addEmployee() {
  const aEmpId = document.getElementById('aEmpId');
  if (!aEmpId) return; // Not on the add page

  const employee_id = aEmpId.value.trim();
  const name = document.getElementById('aName').value.trim();
  const department = document.getElementById('aDept').value.trim();
  const designation = document.getElementById('aDesig').value.trim();
  const email = document.getElementById('aEmail').value.trim();
  const phone = document.getElementById('aPhone').value.trim();
  const password = document.getElementById('aPass').value;
  const msgEl = document.getElementById('addEmpMsg');

  if (!employee_id || !name || !department || !designation || !email || !phone || !password) {
    if (msgEl) msgEl.textContent = 'Fill all fields.';
    return;
  }

  const res = await fetch('/api/admin/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id, name, department, designation, email, phone, password })
  });
  const data = await res.json();
  if (!res.ok) {
    if (msgEl) msgEl.textContent = data.error || 'Insert failed.';
    return;
  }

  if (msgEl) msgEl.textContent = 'Employee added.';

  // Clear fields
  aEmpId.value = '';
  document.getElementById('aName').value = '';
  document.getElementById('aDept').value = '';
  document.getElementById('aDesig').value = '';
  document.getElementById('aEmail').value = '';
  document.getElementById('aPhone').value = '';
  document.getElementById('aPass').value = '';

  await loadEmployees();
}

async function loadStack() {
  const res = await fetch('/api/leave/stack');
  if (!res.ok) return location.href = '/';
  const data = await res.json();
  const tbody = document.getElementById('stackRows');
  if (!tbody) return;
  tbody.innerHTML = '';

  data.rows.forEach(r => {
    const canApprove = r.status === 'NOT_APPROVED';
    const statusClass = r.status.toLowerCase().includes('approved') && !r.status.toLowerCase().includes('not') ? 'status-approved' :
      (r.status.toLowerCase().includes('not_approved') ? 'status-pending' : 'status-rejected');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">${r.leave_code}</code></td>
      <td><span style="font-weight: 600;">${r.name}</span> <br><small style="color: grey;">${r.employee_id}</small></td>
      <td><span style="font-weight: 500;">${r.leave_type}</span></td>
      <td style="color: var(--text-muted); font-size: 0.8rem;">${r.start_date} → <br>${r.end_date}</td>
      <td><span style="background: #eef2ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${r.days}</span></td>
      <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${r.reason}</td>
      <td><span class="status-badge ${statusClass}">${r.status}</span></td>
      <td>
        ${canApprove ? `<button class="approve btn btn-success" style="padding: 4px 12px; font-size: 0.75rem;" data-id="${r.id}"><i data-lucide="check" style="width: 12px; margin-right: 4px;"></i> Approve</button>` : '-'}
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (window.lucide) lucide.createIcons();

  document.querySelectorAll('.approve').forEach(btn => {
    btn.addEventListener('click', () => approve(btn.dataset.id));
  });
}

async function approve(id) {
  const res = await fetch(`/api/leave/${id}/approve`, { method: 'POST' });
  await res.json();
  loadStack();
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  location.href = '/';
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', logout);

const addEmpBtn = document.getElementById('addEmpBtn');
if (addEmpBtn) addEmpBtn.addEventListener('click', addEmployee);

loadEmployees();
loadStack();
