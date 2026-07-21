const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
module.exports = new Pool({ connectionString: process.env.DATABASE_URL });
