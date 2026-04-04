const dns = require('dns');
try {
  if (process.env.NODE_ENV !== 'production') {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
} catch (err) {
  // Ignore DNS override errors in restricted environments like Vercel Lambda
}

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const { connectDB, Employee, LeaveRequest, isValidObjectId } = require('./db');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true }
}));

app.use(express.static(path.join(__dirname, 'public')));

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

function daysBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.floor((end - start) / (24 * 60 * 60 * 1000));
  return diff + 1;
}

function makeLeaveCode() {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 900) + 100;
  return `LV-${ts}-${rand}`;
}

async function ensureAdmin() {
  const existingAdmin = await Employee.findOne({ role: 'ADMIN' }).lean();
  if (existingAdmin) return;

  const hash = await bcrypt.hash('admin123', 10);
  await Employee.create({
    employee_id: 'ADMIN001',
    name: 'Admin User',
    department: 'Administration',
    designation: 'System Admin',
    email: 'admin@company.com',
    phone: '9999999999',
    password_hash: hash,
    role: 'ADMIN',
    remaining_days: 999
  });
  console.log('Default admin created: admin@company.com / admin123');
}

function formatDateOnly(value) {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 10);
}

function serializeLeaveRequest(doc) {
  return {
    id: String(doc._id),
    leave_code: doc.leave_code,
    leave_type: doc.leave_type,
    start_date: formatDateOnly(doc.start_date),
    end_date: formatDateOnly(doc.end_date),
    days: doc.days,
    reason: doc.reason,
    status: doc.status,
    created_at: doc.created_at || null,
    decided_at: doc.decided_at || null
  };
}

app.post('/api/register', async (req, res) => {
  const { employee_id, name, department, designation, email, phone, password, role, adminSecret } = req.body;
  if (!employee_id || !name || !department || !designation || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  let assignedRole = 'EMP';
  if (role === 'ADMIN') {
    if (adminSecret === 'password123') {
      assignedRole = 'ADMIN';
    } else {
      return res.status(403).json({ error: 'User not allowed to make admin account' });
    }
  }

  const hash = await bcrypt.hash(password, 10);

  try {
    const existing = await Employee.findOne({ $or: [{ employee_id }, { email }] }).lean();
    if (existing) {
      return res.status(409).json({ error: 'Employee ID or email already exists.' });
    }

    await Employee.create({
      employee_id,
      name,
      department,
      designation,
      email,
      phone,
      password_hash: hash,
      role: assignedRole,
      remaining_days: 20
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Registration failed.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

  const user = await Employee.findOne({ email }, 'employee_id name email password_hash role').lean();
  if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials.' });

  req.session.user = {
    id: String(user._id),
    employee_id: user.employee_id,
    name: user.name,
    email: user.email,
    role: user.role
  };

  res.json({ ok: true, role: user.role });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', requireAuth, async (req, res) => {
  const user = await Employee.findById(
    req.session.user.id,
    'employee_id name department designation email phone role remaining_days'
  ).lean();

  if (!user) return res.status(404).json({ error: 'User not found.' });

  res.json({ user });
});

app.post('/api/admin/employees', requireAdmin, async (req, res) => {
  const { employee_id, name, department, designation, email, phone, password } = req.body;
  if (!employee_id || !name || !department || !designation || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const hash = await bcrypt.hash(password, 10);

  try {
    const existing = await Employee.findOne({ $or: [{ employee_id }, { email }] }).lean();
    if (existing) return res.status(409).json({ error: 'Employee ID or email already exists.' });

    await Employee.create({
      employee_id,
      name,
      department,
      designation,
      email,
      phone,
      password_hash: hash,
      role: 'EMP',
      remaining_days: 20
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Insert failed.' });
  }
});

app.get('/api/admin/employees', requireAdmin, async (req, res) => {
  const rows = await Employee.find(
    { role: 'EMP' },
    'employee_id name department designation email phone'
  ).sort({ name: 1 }).lean();

  res.json({ rows });
});

app.post('/api/leave/apply', requireAuth, async (req, res) => {
  const { leave_type, start_date, end_date, reason } = req.body;
  if (!leave_type || !start_date || !end_date || !reason) return res.status(400).json({ error: 'All fields required.' });

  const days = daysBetween(start_date, end_date);
  if (isNaN(days) || days <= 0) return res.status(400).json({ error: 'Invalid date range.' });

  try {
    const employee = await Employee.findById(req.session.user.id, 'remaining_days').lean();
    if (!employee) return res.status(404).json({ error: 'Employee not found.' });
    if (days > employee.remaining_days) return res.status(400).json({ error: 'Insufficient leave balance.' });

    await LeaveRequest.create({
      leave_code: makeLeaveCode(),
      employee: req.session.user.id,
      leave_type,
      start_date,
      end_date,
      days,
      reason,
      status: 'NOT_APPROVED'
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Apply failed.' });
  }
});

app.get('/api/leave/mine', requireAuth, async (req, res) => {
  const docs = await LeaveRequest.find(
    { employee: req.session.user.id },
    'leave_code leave_type start_date end_date days reason status created_at decided_at'
  ).sort({ created_at: -1 }).lean();

  const rows = docs.map(serializeLeaveRequest);
  res.json({ rows });
});

app.get('/api/leave/stack', requireAdmin, async (req, res) => {
  const docs = await LeaveRequest.find(
    {},
    'leave_code leave_type start_date end_date days reason status created_at employee'
  ).populate('employee', 'employee_id name').sort({ created_at: -1 }).lean();

  const rows = docs.map((doc) => ({
    ...serializeLeaveRequest(doc),
    employee_id: doc.employee?.employee_id || '',
    name: doc.employee?.name || ''
  }));

  res.json({ rows });
});

app.post('/api/leave/:id/approve', requireAdmin, async (req, res) => {
  const id = req.params.id;
  if (!isValidObjectId(id)) return res.status(404).json({ error: 'Request not found.' });

  try {
    const leave = await LeaveRequest.findOne({ _id: id, status: 'NOT_APPROVED' }, 'employee days status').lean();
    if (!leave) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    const balanceUpdate = await Employee.updateOne(
      { _id: leave.employee, remaining_days: { $gte: leave.days } },
      { $inc: { remaining_days: -leave.days } }
    );
    if (balanceUpdate.modifiedCount === 0) {
      return res.status(400).json({ error: 'Insufficient balance at approval.' });
    }

    const approvalUpdate = await LeaveRequest.updateOne(
      { _id: id, status: 'NOT_APPROVED' },
      { $set: { status: 'APPROVED', decided_at: new Date(), decided_by: req.session.user.id } }
    );
    if (approvalUpdate.modifiedCount === 0) {
      await Employee.updateOne({ _id: leave.employee }, { $inc: { remaining_days: leave.days } });
      return res.status(400).json({ error: 'Already approved.' });
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Approval failed.' });
  }
});

app.get('/employee', (req, res) => res.redirect('/dashboard'));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/apply', (req, res) => res.sendFile(path.join(__dirname, 'public', 'apply.html')));
app.get('/history', (req, res) => res.sendFile(path.join(__dirname, 'public', 'history.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(__dirname, 'public', 'profile.html')));
app.get('/admin', (req, res) => res.redirect('/admin/dashboard'));
app.get('/admin/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html')));
app.get('/admin/queue', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin-queue.html')));
app.get('/admin/employees', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin-employees.html')));
app.get('/admin/add', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin-add.html')));

connectDB()
  .then(ensureAdmin)
  .catch((err) => console.error('Failed to start DB:', err.message));

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
