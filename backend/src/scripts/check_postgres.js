import { Sequelize } from 'sequelize';
import { postgresUri, postgresConfig } from '../config/database.js';

const checkPostgres = async () => {
  try {
    console.log('Attempting to connect to PostgreSQL...');
    const sequelize = new Sequelize(postgresUri, postgresConfig);
    await sequelize.authenticate();
    console.log('PostgreSQL connection has been established successfully.');
    await sequelize.close();
  } catch (error) {
    console.error('Unable to connect to the PostgreSQL database:', error);
    process.exit(1);
  }
};

checkPostgres();
