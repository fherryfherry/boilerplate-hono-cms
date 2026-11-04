const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

function getEnv() {
  return {
    appName: process.env.APP_NAME || 'TanpaNgoding App',
    appEnv: process.env.APP_ENV || process.env.NODE_ENV || 'local',
    appKey: process.env.APP_KEY || 'default-dev-secret-change-in-env',
    port: Number(process.env.PORT || 8000),
    dbConnection: (process.env.DB_CONNECTION || 'sqlite').toLowerCase(),
    dbHost: process.env.DB_HOST || '127.0.0.1',
    dbPort: Number(process.env.DB_PORT || (process.env.DB_CONNECTION === 'pgsql' ? 5432 : 3306)),
    dbDatabase: process.env.DB_DATABASE || path.resolve(process.cwd(), 'storage/database.sqlite'),
    dbUsername: process.env.DB_USERNAME || '',
    dbPassword: process.env.DB_PASSWORD || '',
  };
}

module.exports = { getEnv };
