/* eslint-disable no-unused-vars */

/**
 * Common error handling middleware
 */
const config = require('config')
const { UniqueConstraintError } = require('sequelize')
const logger = require('tc-framework').logger(config)

const DEFAULT_MESSAGE = 'Something is broken at API server-side.'

/**
 * The error middleware function
 *
 * @param  {Object}     err       the error that is thrown in the application
 * @param  {Object}     req       the express request instance
 * @param  {Object}     res       the express response instance
 * @param  {Function}   next      the next middleware in the chain
 */
function middleware (err, req, res, next) {
  logger.logFullError(err)

  if (err instanceof UniqueConstraintError) {
    res.status(409).json({ message: err.message })
  } else if (err.isJoi) {
    res.status(400).json({ message: err.details[0].message })
  } else {
    const status = err.status || 500
    const message = err.message || DEFAULT_MESSAGE
    res.status(status).json({ message })
  }
}

module.exports = () => middleware
