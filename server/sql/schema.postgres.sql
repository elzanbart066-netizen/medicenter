-- MediCenter database schema (PostgreSQL 13+), the same tables as schema.sql.
-- Flags stay SMALLINT 0/1 like BIT, so queries written for SQL Server work unchanged.

DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS doctor_branches CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS specialties CASCADE;

CREATE TABLE specialties (
  id VARCHAR(32) PRIMARY KEY,
  icon VARCHAR(16) NOT NULL,
  name_kk VARCHAR(100) NOT NULL,
  name_ru VARCHAR(100) NOT NULL
);

CREATE TABLE organizations (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description_kk VARCHAR(1000) NOT NULL,
  description_ru VARCHAR(1000) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  hours_kk VARCHAR(100) NOT NULL,
  hours_ru VARCHAR(100) NOT NULL,
  color VARCHAR(40) NOT NULL DEFAULT 'from-navy to-brand',
  status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  featured SMALLINT NOT NULL DEFAULT 0,
  sponsored SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP(0) NOT NULL DEFAULT (now() AT TIME ZONE 'UTC' + INTERVAL '5 hours')
);

CREATE TABLE users (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'clinic_admin', 'platform_admin')),
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  organization_id INT NULL REFERENCES organizations(id),
  created_at TIMESTAMP(0) NOT NULL DEFAULT (now() AT TIME ZONE 'UTC' + INTERVAL '5 hours')
);

CREATE TABLE branches (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id),
  district VARCHAR(32) NOT NULL,
  address_kk VARCHAR(200) NOT NULL,
  address_ru VARCHAR(200) NOT NULL
);

CREATE TABLE doctors (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id),
  user_id INT NULL REFERENCES users(id),
  full_name VARCHAR(120) NOT NULL,
  specialty_id VARCHAR(32) NOT NULL REFERENCES specialties(id),
  experience SMALLINT NOT NULL DEFAULT 0,
  active SMALLINT NOT NULL DEFAULT 1
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
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id),
  specialty_id VARCHAR(32) NOT NULL REFERENCES specialties(id),
  name_kk VARCHAR(150) NOT NULL,
  name_ru VARCHAR(150) NOT NULL,
  price INT NOT NULL CHECK (price > 0),
  duration SMALLINT NOT NULL DEFAULT 30,
  active SMALLINT NOT NULL DEFAULT 1
);

CREATE TABLE appointments (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES users(id),
  organization_id INT NOT NULL REFERENCES organizations(id),
  branch_id INT NOT NULL REFERENCES branches(id),
  doctor_id INT NOT NULL REFERENCES doctors(id),
  service_id INT NOT NULL REFERENCES services(id),
  starts_at TIMESTAMP(0) NOT NULL,
  ends_at TIMESTAMP(0) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  patient_name VARCHAR(120) NOT NULL,
  patient_phone VARCHAR(20) NOT NULL,
  comment VARCHAR(300) NOT NULL DEFAULT '',
  created_at TIMESTAMP(0) NOT NULL DEFAULT (now() AT TIME ZONE 'UTC' + INTERVAL '5 hours')
);

CREATE INDEX ix_appointments_doctor_time ON appointments(doctor_id, starts_at);

-- Only one review per completed appointment
CREATE TABLE reviews (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  appointment_id INT NOT NULL UNIQUE REFERENCES appointments(id),
  patient_id INT NOT NULL REFERENCES users(id),
  organization_id INT NOT NULL REFERENCES organizations(id),
  doctor_id INT NOT NULL REFERENCES doctors(id),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text VARCHAR(500) NOT NULL DEFAULT '',
  created_at TIMESTAMP(0) NOT NULL DEFAULT (now() AT TIME ZONE 'UTC' + INTERVAL '5 hours')
);
