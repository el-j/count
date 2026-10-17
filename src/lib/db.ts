import mysql from 'mysql2/promise';

export interface DatabaseConnectionConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export function getDatabaseConfig(): DatabaseConnectionConfig | null {
  const host = process.env.COUNTER_DB_HOST ?? process.env.MYSQL_HOST ?? process.env.DB_HOST ?? '';
  const port = Number(process.env.COUNTER_DB_PORT ?? process.env.MYSQL_PORT ?? process.env.DB_PORT ?? '3306');
  const database = process.env.COUNTER_DB_NAME ?? process.env.MYSQL_DATABASE ?? process.env.DB_NAME ?? '';
  const user = process.env.COUNTER_DB_USER ?? process.env.MYSQL_USER ?? process.env.DB_USER ?? '';
  const password = process.env.COUNTER_DB_PASSWORD ?? process.env.MYSQL_PASSWORD ?? process.env.DB_PASSWORD ?? '';

  if (!host || !database || !user || !password) {
    return null;
  }

  return {
    host,
    port: Number.isFinite(port) ? port : 3306,
    database,
    user,
    password,
  };
}

export async function createDatabaseConnection() {
  const config = getDatabaseConfig();
  if (!config) {
    throw new Error('Remote database configuration is missing. Set COUNTER_DB_HOST, COUNTER_DB_NAME, COUNTER_DB_USER, and COUNTER_DB_PASSWORD.');
  }

  return mysql.createPool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    charset: 'utf8mb4',
    connectTimeout: 5000,
    enableKeepAlive: true,
  });
}

export async function ensureDatabaseSchema(pool: Awaited<ReturnType<typeof createDatabaseConnection>>) {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS counter_state (
      device_id VARCHAR(64) NOT NULL,
      station_name VARCHAR(128) DEFAULT 'Tür 1',
      current_count INT NOT NULL DEFAULT 0,
      target_count INT NOT NULL DEFAULT 300,
      recipient_email VARCHAR(255) DEFAULT '',
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (device_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS counter_events (
      id BIGINT NOT NULL AUTO_INCREMENT,
      device_id VARCHAR(64) NOT NULL,
      event_id VARCHAR(128) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      delta INT NOT NULL,
      resulting_total INT NOT NULL,
      label VARCHAR(128) DEFAULT '',
      event_time DATETIME NOT NULL,
      payload JSON DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uq_counter_event (event_id),
      KEY idx_counter_events_device (device_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

export function getDatabaseHealthSummary(): string {
  const config = getDatabaseConfig();
  if (!config) {
    return 'not-configured';
  }
  return `${config.host}:${config.port}/${config.database}`;
}
