const msg = (text, isError = true) => {
  const el = document.getElementById('msg');
  el.textContent = text;
  el.style.color = isError ? 'var(--error)' : 'var(--success)';
  el.style.opacity = '1';
};

async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  if (!email || !password) return msg('Enter email and password.');

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) return msg(data.error || 'Login failed.');
  if (data.role === 'ADMIN') {
    location.href = '/admin';
  } else {
    location.href = '/employee';
  }
}

async function register() {
  const employee_id = document.getElementById('empId').value.trim();
  const name = document.getElementById('name').value.trim();
  const department = document.getElementById('department').value.trim();
  const designation = document.getElementById('designation').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  if (!employee_id || !name || !department || !designation || !phone || !email || !password) {
    return msg('Fill all registration fields.');
  }

  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id, name, department, designation, phone, email, password })
  });
  const data = await res.json();
  if (!res.ok) return msg(data.error || 'Registration failed.');
  msg('Registered. Now login.', false);
}

document.getElementById('loginBtn').addEventListener('click', login);
document.getElementById('registerBtn').addEventListener('click', register);
