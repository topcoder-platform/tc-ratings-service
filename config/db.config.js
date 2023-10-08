require('dotenv').config()

module.exports = {
  username: 'ratings',
  password: 'password',
  database: 'tc_ratings',
  host: '127.0.0.1',
  port: 5432,
  dialect: 'postgres',
  logging: true
}
