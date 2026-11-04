const fs = require('fs');
const path = require('path');
const { getEnv } = require('../config/env');

let sqliteDb = null;
let pgPool = null;
let mysqlPool = null;

function convertPlaceholdersToPg(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function getSqliteInstance(dbPath) {
  if (sqliteDb) return sqliteDb;
  const resolved = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  const { DatabaseSync } = require('node:sqlite');
  sqliteDb = new DatabaseSync(resolved);
  sqliteDb.exec('PRAGMA journal_mode = WAL;');
  sqliteDb.exec('PRAGMA foreign_keys = ON;');
  return sqliteDb;
}

function getPgPool(env) {
  if (pgPool) return pgPool;
  const { Pool } = require('pg');
  pgPool = new Pool({
    host: env.dbHost,
    port: env.dbPort || 5432,
    database: env.dbDatabase,
    user: env.dbUsername,
    password: env.dbPassword,
    max: 10,
  });
  return pgPool;
}

function getMysqlPool(env) {
  if (mysqlPool) return mysqlPool;
  const mysql = require('mysql2/promise');
  mysqlPool = mysql.createPool({
    host: env.dbHost,
    port: env.dbPort || 3306,
    database: env.dbDatabase,
    user: env.dbUsername,
    password: env.dbPassword,
    waitForConnections: true,
    connectionLimit: 10,
  });
  return mysqlPool;
}

function getEngine() {
  const { dbConnection } = getEnv();
  if (dbConnection === 'pgsql' || dbConnection === 'postgres' || dbConnection === 'postgresql') return 'postgres';
  if (dbConnection === 'mysql' || dbConnection === 'mariadb') return 'mariadb';
  return 'sqlite';
}

async function all(sql, params = []) {
  const env = getEnv();
  const engine = getEngine();
  if (engine === 'sqlite') {
    const db = getSqliteInstance(env.dbDatabase);
    return db.prepare(sql).all(...params);
  }
  if (engine === 'postgres') {
    const pool = getPgPool(env);
    const res = await pool.query(convertPlaceholdersToPg(sql), params);
    return res.rows;
  }
  const pool = getMysqlPool(env);
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function get(sql, params = []) {
  const rows = await all(sql, params);
  return rows[0] || null;
}

async function run(sql, params = []) {
  const env = getEnv();
  const engine = getEngine();
  if (engine === 'sqlite') {
    const db = getSqliteInstance(env.dbDatabase);
    const info = db.prepare(sql).run(...params);
    return { changes: Number(info.changes || 0), lastInsertRowid: Number(info.lastInsertRowid || 0) };
  }
  if (engine === 'postgres') {
    const pool = getPgPool(env);
    let pgSql = convertPlaceholdersToPg(sql);
    const isInsert = /^\s*insert\s+/i.test(pgSql) && !/\breturning\b/i.test(pgSql);
    if (isInsert) pgSql += ' RETURNING id';
    const res = await pool.query(pgSql, params);
    return {
      changes: res.rowCount || 0,
      lastInsertRowid: res.rows?.[0]?.id || 0,
    };
  }
  const pool = getMysqlPool(env);
  const [result] = await pool.execute(sql, params);
  return {
    changes: result.affectedRows || 0,
    lastInsertRowid: result.insertId || 0,
  };
}

async function execRaw(sql) {
  const env = getEnv();
  const engine = getEngine();
  if (engine === 'sqlite') {
    const db = getSqliteInstance(env.dbDatabase);
    db.exec(sql);
    return;
  }
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (engine === 'postgres') {
    const pool = getPgPool(env);
    for (const stmt of statements) {
      const adapted = stmt
        .replace(/INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
        .replace(/DATETIME\s+DEFAULT\s+CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      await pool.query(adapted);
    }
    return;
  }
  const pool = getMysqlPool(env);
  for (const stmt of statements) {
    const adapted = stmt
      .replace(/INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT/gi, 'INT AUTO_INCREMENT PRIMARY KEY');
    await pool.query(adapted);
  }
}

async function close() {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
  }
  if (mysqlPool) {
    await mysqlPool.end();
    mysqlPool = null;
  }
}

module.exports = { all, get, run, execRaw, getEngine, close };
