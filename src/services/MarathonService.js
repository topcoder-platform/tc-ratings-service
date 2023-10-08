const _ = require('lodash')
const config = require('config')
const logger = require('tc-framework').logger(config)

const db = require('../models')

const helper = require('../common/helper')
const { lowerCase } = require('lodash')

const INITIAL_RATING = 1200
const ONE_STD_DEV_EQUALS = 1200
const INITIAL_VOL = 515

const INITIAL_WEIGHT = 0.6
const FINAL_WEIGHT = 0.18

const FIRST_VOLATILITY = 385

/**
 * Calculate Ratings
 * @param {Object} data data object from the request (contains challengeId)
 * @returns {Promise<Object>} success message of the calculated ratings
 */
async function calculate(data) {
  try {
    logger.info(`=== start: mm ratings calcualtion for challenge ${data.challengeId}`)
    const finalSubmissions = await helper.getFinalSubmissions(data.challengeId)

    // fetch the current ratings of the members
    let currentRatings = []

    for (const sub in finalSubmissions) {
      logger.debug(`fetching members data for ${finalSubmissions[sub].memberId}`)
      const retValue = await db.Ratings.findOne({
        attributes: [
          'rating',
          'volatility',
          'ratings_count',
          'member_id'
        ],
        where: {
          member_id: finalSubmissions[sub].memberId,
          rating_type_id: 'MM'
        }
      })

      if (retValue === null) {
        currentRatings = _.concat(currentRatings, {
          rating: INITIAL_RATING,
          volatility: INITIAL_VOL,
          ratings_count: 0,
          member_id: finalSubmissions[sub].memberId,
          finalScore: finalSubmissions[sub].finalScore,
          arank: 0,
          aperf: 0
        })
      } else {
        const data = retValue.get({ plain: true })
        data.finalScore = finalSubmissions[sub].finalScore
        data.arank = 0
        data.aperf = 0
        currentRatings = _.concat(currentRatings, data)
      }
    }

    // find the average rating
    const averageRating = _.sumBy(currentRatings, 'rating') / currentRatings.length
    logger.debug(`average ratings = ${averageRating}`)

    // calculate competition factor
    const compFactor = await calculateCompetitionFactor(currentRatings)
    logger.debug(`competition factor = ${compFactor}`)

    // calculate expected rank
    await expectedRanks(currentRatings)

    // calculate actual rank
    await actualRanks(currentRatings)

    // update ratings
    await calculateRatings(currentRatings, compFactor)

    logger.debug('returning final result')
    return currentRatings
  } catch (err) {

    // next(err)
  }
}

async function calculateCompetitionFactor (data) {
  let rTemp = 0
  let vTemp = 0

  for (const x in data) {
    vTemp += Math.pow(data[x].volatility, 2)
    rTemp += Math.pow(data[x].rating, 2)
  }

  return Math.sqrt(vTemp / data.length + rTemp / (data.length - 1))
}

async function calculateRatings (data, compFactor) {
  for (let x = 0; x < data.length; x++) {
    const diff = data[x].aperf - data[x].eperf
    const oldRating = data[x].rating
    const performedAs = oldRating + diff * compFactor

    let weight = (INITIAL_WEIGHT - FINAL_WEIGHT) / (data[x].ratings_count + 1) + FINAL_WEIGHT

    // reduce weight for highly rated people
    weight = 1 / (1 - weight) - 1

    if (oldRating >= 2000 && oldRating < 2500) {
      weight = weight * 4.5 / 5
    }

    if (oldRating >= 2500) {
      weight = weight * 4 / 5
    }

    let newRating = (oldRating + weight * performedAs) / (1 + weight)

    // inforce a cap
    const cap = 150 + 1500 / (2 + data[x].ratings_count)

    if (oldRating - newRating > cap) {
      newRating = oldRating - cap
    }

    if (newRating - oldRating > cap) {
      newRating = oldRating + cap
    }

    if (newRating < 1) {
      newRating = 1
    }

    data[x].newRating = Math.round(newRating)

    if (data[x].ratings_count !== 0) {
      const oldVolatility = data[x].volatility
      data[x].newVolatility = Math.round(Math.sqrt((oldVolatility * oldVolatility) / (1 + weight) + ((newRating - oldRating) * (newRating - oldRating)) / weight))
    } else {
      data[x].newVolatility = FIRST_VOLATILITY
    }
  }
}

async function expectedRanks (data) {
  logger.debug(' === start: calculate expected ranks ===')
  for (let x = 0; x < data.length; x++) {
    let est = 0.5

    for (let y = 0; y < data.length; y++) {
      est += winProbability(data[y].rating, data[x].rating, data[y].volatility, data[x].volatility)
    }

    data[x].erank = est
    data[x].eperf = -(await normSInv((est - 0.5) / data.length))
  }
  logger.debug(' === end: calculate expected ranks ===')
}

async function actualRanks (data) {
  logger.debug(' === start: calculate actual ranks ===')
  for (let x = 0; x < data.length;) {
    let max = Number.NEGATIVE_INFINITY
    let count = 0

    for (let y = 0; y < data.length; y++) {
      if (data[y].finalScore >= max && data[y].arank === 0) {
        count = data[y].finalScore === max ? count + 1 : 1
        max = data[y].finalScore
      }
    }

    for (let y = 0; y < data.length; y++) {
      if (data[y].finalScore === max) {
        data[y].arank = x + 0.5 + count / 2
        data[y].aperf = -(await normSInv((x + count / 2) / data.length))
      }
    }

    x += count
  }
  logger.debug(' === end: calculate actual ranks ===')
}

function winProbability (r1, r2, v1, v2) {
  return (erf((r1 - r2) / Math.sqrt(2 * (v1 * v1 + v2 * v2))) + 1) * 0.5
}

function erf (x) {
  const t = 1 / (1 + 0.5 * Math.abs(x))
  const result = 1 - t * Math.exp(-x * x - 1.26551223 +
    t * (1.00002368 +
      t * (0.37409196 +
        t * (0.09678418 +
          t * (-0.18628806 +
            t * (0.27886807 +
              t * (-1.13520398 +
                t * (1.48851587 +
                  t * (-0.82215223 +
                    t * (0.17087277)
                  ))))))))
  )
  return x >= 0 ? result : -result
}

function normSInv (p) {
  const A1 = -3.969683028665376e+01
  const A2 = 2.209460984245205e+02
  const A3 = -2.759285104469687e+02
  const A4 = 1.383577518672690e+02
  const A5 = -3.066479806614716e+01
  const A6 = 2.506628277459239e+00

  const B1 = -5.447609879822406e+01
  const B2 = 1.615858368580409e+02
  const B3 = -1.556989798598866e+02
  const B4 = 6.680131188771972e+01
  const B5 = -1.328068155288572e+01

  const C1 = -7.78489400243029E-03
  const C2 = -3.223964580411365e-01
  const C3 = -2.400758277161838e+00
  const C4 = -2.549732539343734e+00
  const C5 = 4.374664141464968e+00
  const C6 = 2.938163982698783e+00

  const D1 = 7.784695709041462e-03
  const D2 = 3.224671290700398e-01
  const D3 = 2.445134137142996e+00
  const D4 = 3.754408661907416e+00

  const P_LOW = 0.02425
  const P_HIGH = 1 - P_LOW

  let q, r
  let z = 0

  if (p <= 0) return Number.NEGATIVE_INFINITY
  else if (p >= 1) return Number.POSITIVE_INFINITY

  // Rational approximation for lower region:
  if (p < P_LOW) {
    q = Math.sqrt(-2 * Math.log(p))
    z = (((((C1 * q + C2) * q + C3) * q + C4) * q + C5) * q + C6) / ((((D1 * q + D2) * q + D3) * q + D4) * q + 1)
  } else if (P_HIGH < p) {
    q = Math.sqrt(-2 * Math.log(1 - p))
    z = -(((((C1 * q + C2) * q + C3) * q + C4) * q + C5) * q + C6) / ((((D1 * q + D2) * q + D3) * q + D4) * q + 1)
  } else {
    q = p - 0.5
    r = q * q
    z = (((((A1 * r + A2) * r + A3) * r + A4) * r + A5) * r + A6) * q / (((((B1 * r + B2) * r + B3) * r + B4) * r + B5) * r + 1)
  }

  z = refine(z, p)

  return z
}

function refine (x, d) {
  if (d > 0 && d < 1) {
    const e = 0.5 * erfc(-x / Math.sqrt(2)) - d
    const u = e * Math.sqrt(2 * Math.PI) * Math.exp((x * x) / 2)
    x = x - u / (1 + x * u / 2)
  }
  return x
}

function erfc (z) {
  return 1 - erf(z)
}

module.exports = {
  calculate
}
