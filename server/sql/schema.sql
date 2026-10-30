-- MediCenter database schema (MySQL 8 / MariaDB 10.6+)

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS reviews, appointments, services, doctor_branches, doctors, branches, users, organizations, specialties;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE specialties (
  id VARCHAR(32) PRIMARY KEY,
  icon VARCHAR(16) NOT NULL,
  name_kk VARCHAR(100) NOT NULL,
  name_ru VARCHAR(100) NOT NULL
);

CREATE TABLE organizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description_kk TEXT NOT NULL,
  description_ru TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  hours_kk VARCHAR(100) NOT NULL,
  hours_ru VARCHAR(100) NOT NULL,
  color VARCHAR(40) NOT NULL DEFAULT 'from-navy to-brand',
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  sponsored BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role ENUM('patient', 'doctor', 'clinic_admin', 'platform_admin') NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  organization_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  district VARCHAR(32) NOT NULL,
  address_kk VARCHAR(200) NOT NULL,
  address_ru VARCHAR(200) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  user_id INT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  specialty_id VARCHAR(32) NOT NULL,
  experience TINYINT UNSIGNED NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (specialty_id) REFERENCES specialties(id)
);

-- A doctor can work in several branches of the same clinic
CREATE TABLE doctor_branches (
  doctor_id INT NOT NULL,
  branch_id INT NOT NULL,
  PRIMARY KEY (doctor_id, branch_id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

CREATE TABLE services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  specialty_id VARCHAR(32) NOT NULL,
  name_kk VARCHAR(150) NOT NULL,
  name_ru VARCHAR(150) NOT NULL,
  price INT UNSIGNED NOT NULL,
  duration SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (specialty_id) REFERENCES specialties(id)
);

CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  organization_id INT NOT NULL,
  branch_id INT NOT NULL,
  doctor_id INT NOT NULL,
  service_id INT NOT NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  patient_name VARCHAR(120) NOT NULL,
  patient_phone VARCHAR(20) NOT NULL,
  comment VARCHAR(300) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_doctor_time (doctor_id, starts_at),
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  FOREIGN KEY (service_id) REFERENCES services(id)
);

-- Only one review per completed appointment
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL UNIQUE,
  patient_id INT NOT NULL,
  organization_id INT NOT NULL,
  doctor_id INT NOT NULL,
  rating TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text VARCHAR(500) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);
