CREATE DATABASE IF NOT EXISTS leave_db;
USE leave_db;

CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(60) NOT NULL,
    role ENUM('EMP','ADMIN') NOT NULL DEFAULT 'EMP'
);

CREATE TABLE IF NOT EXISTS leave_balance (
    employee_id INT PRIMARY KEY,
    remaining_days INT NOT NULL DEFAULT 20,
    CONSTRAINT fk_balance_employee
        FOREIGN KEY (employee_id) REFERENCES employees(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    leave_code VARCHAR(30) NOT NULL UNIQUE,
    employee_id INT NOT NULL,
    leave_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    status ENUM('NOT_APPROVED','APPROVED') NOT NULL DEFAULT 'NOT_APPROVED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decided_at TIMESTAMP NULL,
    decided_by INT NULL,
    CONSTRAINT fk_leave_employee
        FOREIGN KEY (employee_id) REFERENCES employees(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_decided_by
        FOREIGN KEY (decided_by) REFERENCES employees(id)
        ON DELETE SET NULL
);
