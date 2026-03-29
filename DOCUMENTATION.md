# Employee Leave Management System

## Objective
Provide a simple, secure system for employees to apply for leave, validate requests, and allow admins to approve with automatic balance updates. Admins can insert employees and view the full leave stack.

## Data Model (MongoDB)
- `employees`: employee profile, login credentials, role, and `remaining_days`.
- `leave_requests`: leave applications with status, decision info, and employee reference.

## Flowchart: Apply ? Validate ? Approve
See `FLOWCHART.mmd`.

## Module Explanation
- **Admin Insert Employee**: Add employee details and initialize default leave balance.
- **View Employees**: List all registered employees.
- **Leave Stack**: View all leave applications in descending order.
- **Approve Leave**: Update status from NOT_APPROVED to APPROVED and update balance.
- **Employee Profile**: Employees can view department/designation and contact info.
- **Apply Leave**: Validate date range and balance; generate unique leave ID.
- **Check Status**: Employees view approval status.

## Screenshots
Add screenshots to `screenshots` folder:
- `screenshots/login.png`
- `screenshots/admin_insert_employee.png`
- `screenshots/admin_leave_stack.png`
- `screenshots/employee_apply.png`
- `screenshots/employee_status.png`

## Run
1. Install packages: `npm install`
2. Put your MongoDB Atlas connection string in `MONGODB_URI`.
3. Keep `MONGODB_DB` set to your target database name.
4. Start: `npm start`
5. Open: `http://localhost:5000`

Default Admin (auto-created on first run):
- Email: admin@company.com
- Password: admin123
