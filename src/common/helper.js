const _ = require('lodash')
const config = require('config')
const m2mAuth = require('tc-core-library-js').auth
const logger = require('tc-framework').logger(config)
const request = require('superagent')
const prefix = require('superagent-prefix')

const m2m = m2mAuth.m2m(_.pick(config, ['AUTH0_URL', 'AUTH0_AUDIENCE', 'TOKEN_CACHE_TIME', 'AUTH0_PROXY_SERVER_URL']))

/* Function to get M2M token
 * @returns m2m token
 */
async function getM2Mtoken () {
  return m2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
}

/**
 * Check if exists.
 *
 * @param {Array} source the array in which to search for the term
 * @param {Array | String} term the term to search
 */
function checkIfExists (source, term) {
  let terms

  if (!_.isArray(source)) {
    throw new Error('Source argument should be an array')
  }

  source = source.map(s => s.toLowerCase())

  if (_.isString(term)) {
    terms = term.toLowerCase().split(' ')
  } else if (_.isArray(term)) {
    terms = term.map(t => t.toLowerCase())
  } else {
    throw new Error('Term argument should be either a string or an array')
  }

  for (let i = 0; i < terms.length; i++) {
    if (source.includes(terms[i])) {
      return true
    }
  }

  return false
}

/**
 * Wrap async function to standard express function
 * @param {Function} fn the async function
 * @returns {Function} the wrapped function
 */
function wrapExpress (fn) {
  return function (req, res, next) {
    fn(req, res, next).catch(next)
  }
}

/**
 * Wrap all functions from object
 * @param obj the object (controller exports)
 * @returns {Object|Array} the wrapped object
 */
function autoWrapExpress (obj) {
  if (_.isArray(obj)) {
    return obj.map(autoWrapExpress)
  }
  if (_.isFunction(obj)) {
    if (obj.constructor.name === 'AsyncFunction') {
      return wrapExpress(obj)
    }
    return obj
  }
  _.each(obj, (value, key) => {
    obj[key] = autoWrapExpress(value)
  })
  return obj
}

function setResHeaders (req, res, result) {
  res.set('X-Page', parseInt(result.page, 10))
  res.set('X-Per-Page', result.perPage)
  res.set('X-Total', result.total)
  res.set('X-Total-Pages', result.numberOfPages)
}

/**
 * Helper function returning prepared superagent instance for using with v5 challenge API.
 * @param {String} token M2M token value
 * @returns {Promise<Object>} superagent instance configured with Authorization header and API url prefix
 */
function getV5Api(token) {
  return request
    .agent()
    .use(prefix(config.V5_API_URL))
    .set('Authorization', `Bearer ${token}`)
}

/**
 * Function to fetch final submissions for a given challenge
 * @param {string} challengeId challengeId
 * @returns {Promise<array>} submissions
 */
async function getFinalSubmissions (challengeId) {
  logger.info('fetching token to get all the submissions')
  const token = await getM2Mtoken()
  logger.info(`fetching submissions for a given challenge: ${challengeId}`)

  let allSubmissions = []
  let response = {}

  const queryParams = {
    challengeId,
    perPage: 500,
    page: 1
  }

  do {
    response = await getV5Api(token).get('/submissions').query(queryParams)
    queryParams.page++
    allSubmissions = _.concat(allSubmissions, response.body)
  } while (response.headers['x-total-pages'] !== response.headers['x-page'])

  // return allSubmissions
  const uniqMembers = _.uniq(_.map(allSubmissions, 'memberId'))

  const finalSubmissions = []
  uniqMembers.forEach(memberId => {
    const memberSubmissions = _.filter(allSubmissions, { memberId })
    const sortedSubs = _.sortBy(memberSubmissions, [function (i) { return new Date(i.created) }])
    // eslint-disable-next-line no-prototype-builtins
    if (_.last(sortedSubs).hasOwnProperty('reviewSummation')) {
      const finalSubmission = _.last(sortedSubs)
      const sortedReviewSummations = _.sortBy(finalSubmission.reviewSummation, [function (i) { return new Date(i.created) }])

      // filter the members who have not submitted the final solution
      if (_.last(sortedReviewSummations).aggregateScore > -1) {
        finalSubmissions.push({
          submissionId: finalSubmission.id,
          memberId: finalSubmission.memberId,
          finalScore: _.last(sortedReviewSummations).aggregateScore
        })
      }
    }
  })

  return _.sortBy(finalSubmissions, ['finalScore'])
}

module.exports = {
  getM2Mtoken,
  checkIfExists,
  autoWrapExpress,
  setResHeaders,
  getFinalSubmissions
}
