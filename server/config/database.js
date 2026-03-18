const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const dbPath = path.join(__dirname, '..', process.env.DB_FILE || 'database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
  define: {
    timestamps: true, 
    underscored: true 
  }
});

const ensureMigrationsTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY
    )
  `);
};

const hasMigration = async (name) => {
  const [rows] = await sequelize.query(
    'SELECT name FROM schema_migrations WHERE name = ? LIMIT 1',
    { replacements: [name] }
  );
  return Array.isArray(rows) && rows.length > 0;
};

const markMigration = async (name) => {
  await sequelize.query('INSERT OR IGNORE INTO schema_migrations (name) VALUES (?)', {
    replacements: [name]
  });
};

const ensureTableHasColumn = async ({ table, column, sqlType }) => {
  const [cols] = await sequelize.query(`PRAGMA table_info('${table}')`);
  const colNames = new Set((cols || []).map((c) => c.name));
  if (colNames.has(column)) return;
  await sequelize.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${sqlType}`);
};

const migrateAddMissingColumns = async () => {
  const migrationName = '2026-03-17_add_missing_columns_users_visits';
  await ensureMigrationsTable();
  if (await hasMigration(migrationName)) return;

  await ensureTableHasColumn({ table: 'Visits', column: 'time', sqlType: 'TEXT' });
  await ensureTableHasColumn({ table: 'Visits', column: 'type', sqlType: 'TEXT' });
  await ensureTableHasColumn({ table: 'Visits', column: 'next_visit_date', sqlType: 'DATE' });
  await ensureTableHasColumn({ table: 'Visits', column: 'care_instructions', sqlType: 'TEXT' });
  await ensureTableHasColumn({ table: 'Visits', column: 'status', sqlType: "TEXT DEFAULT 'active'" });

  await markMigration(migrationName);
};

const migratePatientsOwnerColumnsToOwnerTable = async () => {
  const migrationName = '2026-03-17_remove_owner_columns_from_patients';
  await ensureMigrationsTable();
  if (await hasMigration(migrationName)) return;

  // Проверяем старую схему Patients (owner_name, owner_phone)
  const [cols] = await sequelize.query(`PRAGMA table_info('Patients')`);
  const colNames = new Set((cols || []).map((c) => c.name));
  const hasOwnerName = colNames.has('owner_name');
  const hasOwnerPhone = colNames.has('owner_phone');

  // Если уже нет старых колонок — просто отмечаем миграцию
  if (!hasOwnerName && !hasOwnerPhone) {
    await markMigration(migrationName);
    return;
  }

  // 1) Заполняем Owners из уникальных владельцев Patients
  await sequelize.query(`
    INSERT INTO Owners (full_name, phone, created_at, updated_at)
    SELECT DISTINCT p.owner_name, p.owner_phone, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM Patients p
    WHERE p.owner_name IS NOT NULL AND p.owner_phone IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM Owners o
        WHERE o.full_name = p.owner_name AND o.phone = p.owner_phone
      )
  `);

  // 2) Проставляем owner_id пациентам по совпадению (full_name + phone)
  await sequelize.query(`
    UPDATE Patients
    SET owner_id = (
      SELECT o.id
      FROM Owners o
      WHERE o.full_name = Patients.owner_name AND o.phone = Patients.owner_phone
      LIMIT 1
    )
    WHERE owner_id IS NULL AND owner_name IS NOT NULL AND owner_phone IS NOT NULL
  `);

  // 3) Пересоздаём таблицу Patients без owner_name/owner_phone
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS Patients_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(20) NOT NULL,
      species VARCHAR(30) NOT NULL,
      breed VARCHAR(30),
      age VARCHAR(15) NOT NULL,
      owner_id INTEGER,
      status VARCHAR(255) DEFAULT 'active',
      doctor_id INTEGER,
      next_visit_date DATE,
      care_instructions TEXT,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES Owners(id),
      FOREIGN KEY (doctor_id) REFERENCES Users(id)
    )
  `);

  await sequelize.query(`
    INSERT INTO Patients_new (
      id, name, species, breed, age, owner_id, status, doctor_id, next_visit_date, care_instructions, created_at, updated_at
    )
    SELECT
      id, name, species, breed, age, owner_id, status, doctor_id, next_visit_date, care_instructions, created_at, updated_at
    FROM Patients
  `);

  await sequelize.query(`DROP TABLE Patients`);
  await sequelize.query(`ALTER TABLE Patients_new RENAME TO Patients`);

  await markMigration(migrationName);
};

const ensureAdminUser = async () => {
  const { User } = require('../models');

  const existing = await User.findOne({ where: { role: 'admin' } });
  if (existing) return;

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@vetclinic.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminPhone = process.env.ADMIN_PHONE || '+7 (999) 999-99-99';
  const adminFullName = process.env.ADMIN_FULLNAME || 'Администратор Системы';
  const adminGender = process.env.ADMIN_GENDER || 'male';
  const adminBirthDate = process.env.ADMIN_BIRTHDATE || '1990-01-01';

  await User.create({
    fullName: adminFullName,
    gender: adminGender,
    birthDate: adminBirthDate,
    phone: adminPhone,
    email: adminEmail,
    password: adminPassword,
    role: 'admin',
    isActive: true
  });

  console.log('Администратор создан автоматически');
  console.log('Email:', adminEmail);
  console.log('Пароль:', adminPassword);
};

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('База данных SQLite подключена успешно');
    
    await sequelize.query('PRAGMA foreign_keys = ON');
    console.log('Foreign keys включены');
    
    await sequelize.sync({ alter: false });
    await migrateAddMissingColumns();
    await migratePatientsOwnerColumnsToOwnerTable();
    await ensureAdminUser();
    console.log('Модели синхронизированы');
  } catch (error) {
    console.error('Ошибка подключения к БД:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };