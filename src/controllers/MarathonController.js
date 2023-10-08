const service = require('../services/MarathonService')

/**
 * Calculate Ratings
 * @param {Object} req the request
 * @param {Object} res the response
 * @param {Function} next the next function
 */
async function calculate (req, res, next) {
  try {
    const result = await service.calculate(req.body)
    res.send(result)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  calculate
}
