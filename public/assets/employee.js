async function loadMe() {
  const res = await fetch('/api/me', { cache: 'no-store' });
  if (!res.ok) return location.href = '/';
  const data = await res.json();
  const u = data.user;

  const balanceEl = document.getElementById('balance');
  if (balanceEl) balanceEl.textContent = u.remaining_days;

  const empIdEl = document.getElementById('pEmpId');
  if (empIdEl) empIdEl.textContent = u.employee_id;

  const nameEl = document.getElementById('pName');
  if (nameEl) nameEl.textContent = u.name;

  const deptEl = document.getElementById('pDept');
  if (deptEl) deptEl.textContent = u.department;

  const desigEl = document.getElementById('pDesig');
  if (desigEl) desigEl.textContent = u.designation;

  const emailEl = document.getElementById('pEmail');
  if (emailEl) emailEl.textContent = u.email;

  const phoneEl = document.getElementById('pPhone');
  if (phoneEl) phoneEl.textContent = u.phone;
}

async function loadMine() {
  const res = await fetch('/api/leave/mine', { cache: 'no-store' });
  if (!res.ok) return;
  const data = await res.json();
  const tbody = document.getElementById('myRows');
  if (!tbody) return;

  tbody.innerHTML = '';
  data.rows.forEach(r => {
    const statusClass = r.status === 'APPROVED' ? 'status-approved' :
      (r.status === 'REJECTED' ? 'status-rejected' : 'status-pending');
    
    const lopBadge = r.is_lop ? `<span style="background: #fee2e2; color: #b91c1c; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; margin-left: 5px;">LOP</span>` : '';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">${r.leave_code}</code></td>
      <td><span style="font-weight: 500;">${r.leave_type}${lopBadge}</span></td>
      <td style="color: var(--text-muted);">${r.start_date} → ${r.end_date}</td>
      <td><span style="background: #eef2ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${r.days}</span></td>
      <td style="max-width: 200px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${r.reason}</td>
      <td><span class="status-badge ${statusClass}">${r.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

async function applyLeave() {
  const typeEl = document.getElementById('leaveType');
  const startEl = document.getElementById('startDate');
  const endEl = document.getElementById('endDate');
  const reasonEl = document.getElementById('reason');
  const msgEl = document.getElementById('applyMsg');

  if (!typeEl || !startEl || !endEl || !reasonEl) return;

  const leave_type = typeEl.value;
  const start_date = startEl.value;
  const end_date = endEl.value;
  const reason = reasonEl.value.trim();

  try {
    const res = await fetch('/api/leave/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leave_type, start_date, end_date, reason })
    });
    const data = await res.json();
    if (!res.ok) {
      if (msgEl) msgEl.textContent = data.error || 'Apply failed.';
      if (msgEl) msgEl.style.color = 'var(--error)';
      alert(data.error || 'Apply failed.');
      return;
    }
    if (msgEl) msgEl.textContent = 'Submitted.';
    if (msgEl) msgEl.style.color = 'var(--success)';
    alert('Leave request submitted successfully!');
    reasonEl.value = '';
    await loadMe();
    await loadMine();
  } catch (err) {
    alert('Connectivity issue. Please check your internet.');
  }
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  location.href = '/';
}

const applyBtn = document.getElementById('applyBtn');
if (applyBtn) applyBtn.addEventListener('click', applyLeave);

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', logout);

loadMe();
loadMine();
