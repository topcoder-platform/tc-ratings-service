module.exports = {
  '/marathon': {
    post: {
      controller: 'MarathonController',
      method: 'calculate',
      // auth: 'jwt',
      // access: [config.USER_ROLES.Admin],
      // scopes: [config.SCOPES.CALCULATE_RATINGS]
    }
  }
  // TODO: implement health check endpoint
  // '/health': {
  //   get: {
  //     controller: 'HealthController',
  //     method: 'checkHealth'
  //   }
  // }
}
