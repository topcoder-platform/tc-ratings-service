const _ = require('lodash')
const config = require('config')
const bodyParser = require('body-parser')
const express = require('express')
const interceptor = require('express-interceptor')
const logger = require('tc-framework').logger(config)
const { statusCode } = require('http-status-codes')

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.set('port', config.PORT)

// intercept the response body from jwtAuthenticator
app.use(interceptor((req, res) => {
  return {
    isInterceptable: () => {
      return res.statusCode === 403
    },

    intercept: (body, send) => {
      let obj
      try {
        obj = JSON.parse(body)
      } catch (e) {
        logger.error('invalid response body.')
      }
      if (obj && obj.result && obj.result.content && obj.result.content.message) {
        const ret = { message: obj.result.content.message }
        res.statusCode = 401
        send(JSON.stringify(ret))
      } else {
        send(body)
      }
    }
  }
}))

// register routes
require('./app-routes')(app)

// The error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.logFullError(err, req.signature || `${req.method} ${req.url}`)
  const errorResponse = {}
  const status = err.isJoi ? statusCode.BAD_REQUEST : (err.httpStatus || _.get(err, 'response.status') || statusCode.INTERNAL_SERVER_ERROR)

  if (_.isArray(err.details)) {
    if (err.isJoi) {
      _.map(err.details, (e) => {
        if (e.message) {
          if (_.isUndefined(errorResponse.message)) {
            errorResponse.message = e.message
          } else {
            errorResponse.message += `, ${e.message}`
          }
        }
      })
    }
  }
  if (_.get(err, 'response.status')) {
    // extra error message from axios http response(v4 and v5 tc api)
    errorResponse.message = _.get(err, 'response.data.result.content.message') || _.get(err, 'response.data.message')
  }

  if (_.isUndefined(errorResponse.message)) {
    if (err.message && status !== statusCode.INTERNAL_SERVER_ERROR) {
      errorResponse.message = err.message
    } else {
      errorResponse.message = 'Internal server error'
    }
  }
  res.status(status).json(errorResponse)
})

// const port = config.get('port')

// const db = require('./src/models')
// const members = db.Member

// app.get('/', async (req, res) => {
//   const allRatings = await members.findAll({
//     include: [{
//       model: db.Ratings,
//       as: 'ratings',
//       attributes: {
//         exclude: ['id']
//       }
//     }]
//   })

//   res.send(allRatings)
// })

app.listen(app.get('port'), () => {
  console.log(`server started on port ${app.get('port')}`)
})
