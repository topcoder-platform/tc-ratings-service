require('dotenv').config()

module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  PORT: process.env.PORT || 3000,

  API_VERSION: process.env.API_VERSION || 'v5',

  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID || '',
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET || '',
  AUTH0_URL: process.env.AUTH0_URL || '',
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE || '',
  TOKEN_CACHE_TIME: process.env.TOKEN_CACHE_TIME || 86400000,
  AUTH0_PROXY_SERVER_URL: process.env.AUTH0_PROXY_SERVER_URL || '',

  V5_API_URL: process.env.V5_API_URL || 'https://api.tocoder-dev.com/v5',

  // The scopes to use to validate the M2M token
  SCOPES: {
    CALCULATE_RATINGS: process.env.CALCULATE_RATINGS || 'write:member-ratings',
    READ_RATINGS: process.env.READ_RATINGS || 'read:member-ratings'
  },

  USER_ROLES: {
    Admin: 'administrator'
  }
}
