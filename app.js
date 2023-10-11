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

app.listen(app.get('port'), () => {
  console.log(`server started on port ${app.get('port')}`)
})
