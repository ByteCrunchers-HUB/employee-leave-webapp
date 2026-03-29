const mongoose = require('mongoose');


let isConnected = false;

const employeeSchema = new mongoose.Schema({
  employee_id: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
  designation: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['EMP', 'ADMIN'], default: 'EMP' },
  remaining_days: { type: Number, default: 20 }
});

const leaveRequestSchema = new mongoose.Schema({
  leave_code: { type: String, required: true, unique: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  leave_type: { type: String, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  days: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['NOT_APPROVED', 'APPROVED'], default: 'NOT_APPROVED' },
  created_at: { type: Date, default: Date.now },
  decided_at: { type: Date, default: null },
  decided_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null }
});

leaveRequestSchema.index({ employee: 1, created_at: -1 });

const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
const LeaveRequest = mongoose.models.LeaveRequest || mongoose.model('LeaveRequest', leaveRequestSchema);

async function connectDB() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI in .env');

  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || undefined
  });

  isConnected = true;
}

module.exports = {
  connectDB,
  Employee,
  LeaveRequest,
  isValidObjectId: mongoose.isValidObjectId
};
