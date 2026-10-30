-- MediCenter database schema (Microsoft SQL Server 2016+)

DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS doctor_branches;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS branches;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS organizations;
DROP TABLE IF EXISTS specialties;

CREATE TABLE specialties (
  id VARCHAR(32) PRIMARY KEY,
  icon NVARCHAR(16) NOT NULL,
  name_kk NVARCHAR(100) NOT NULL,
  name_ru NVARCHAR(100) NOT NULL
);

CREATE TABLE organizations (
  id INT IDENTITY PRIMARY KEY,
  slug VARCHAR(64) NOT NULL UNIQUE,
  name NVARCHAR(150) NOT NULL,
  description_kk NVARCHAR(1000) NOT NULL,
  description_ru NVARCHAR(1000) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  hours_kk NVARCHAR(100) NOT NULL,
  hours_ru NVARCHAR(100) NOT NULL,
  color VARCHAR(40) NOT NULL DEFAULT 'from-navy to-brand',
  status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  featured BIT NOT NULL DEFAULT 0,
  sponsored BIT NOT NULL DEFAULT 0,
  created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE users (
  id INT IDENTITY PRIMARY KEY,
  role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'clinic_admin', 'platform_admin')),
  full_name NVARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  organization_id INT NULL REFERENCES organizations(id),
  created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE branches (
  id INT IDENTITY PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id),
  district VARCHAR(32) NOT NULL,
  address_kk NVARCHAR(200) NOT NULL,
  address_ru NVARCHAR(200) NOT NULL
);

CREATE TABLE doctors (
  id INT IDENTITY PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id),
  user_id INT NULL REFERENCES users(id),
  full_name NVARCHAR(120) NOT NULL,
  specialty_id VARCHAR(32) NOT NULL REFERENCES specialties(id),
  experience TINYINT NOT NULL DEFAULT 0,
  active BIT NOT NULL DEFAULT 1
);

-- One login per doctor; many doctors have no login at all
CREATE UNIQUE INDEX ux_doctors_user ON doctors(user_id) WHERE user_id IS NOT NULL;

-- A doctor can work in several branches of the same clinic
CREATE TABLE doctor_branches (
  doctor_id INT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  branch_id INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  PRIMARY KEY (doctor_id, branch_id)
);

CREATE TABLE services (
  id INT IDENTITY PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id),
  specialty_id VARCHAR(32) NOT NULL REFERENCES specialties(id),
  name_kk NVARCHAR(150) NOT NULL,
  name_ru NVARCHAR(150) NOT NULL,
  price INT NOT NULL CHECK (price > 0),
  duration SMALLINT NOT NULL DEFAULT 30,
  active BIT NOT NULL DEFAULT 1
);

CREATE TABLE appointments (
  id INT IDENTITY PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES users(id),
  organization_id INT NOT NULL REFERENCES organizations(id),
  branch_id INT NOT NULL REFERENCES branches(id),
  doctor_id INT NOT NULL REFERENCES doctors(id),
  service_id INT NOT NULL REFERENCES services(id),
  starts_at DATETIME2(0) NOT NULL,
  ends_at DATETIME2(0) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  patient_name NVARCHAR(120) NOT NULL,
  patient_phone VARCHAR(20) NOT NULL,
  comment NVARCHAR(300) NOT NULL DEFAULT '',
  created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME()
);

CREATE INDEX ix_appointments_doctor_time ON appointments(doctor_id, starts_at);

-- Only one review per completed appointment
CREATE TABLE reviews (
  id INT IDENTITY PRIMARY KEY,
  appointment_id INT NOT NULL UNIQUE REFERENCES appointments(id),
  patient_id INT NOT NULL REFERENCES users(id),
  organization_id INT NOT NULL REFERENCES organizations(id),
  doctor_id INT NOT NULL REFERENCES doctors(id),
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text NVARCHAR(500) NOT NULL DEFAULT '',
  created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME()
);
