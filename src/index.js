module.exports = {
  private: {
    accessCodeService: require('./db/private/models/accessCodes'),
    caseService: require('./db/private/models/cases'),
    organizationService: require('./db/private/models/organizations'),
    pointService: require('./db/private/models/points'),
    publicationService: require('./db/private/models/publications'),
    publicOrganizationService: require('./db/private/models/publicOrganizations'),
    settingService: require('./db/private/models/settings'),
    uploadService: require('./db/private/models/upload'),
    userService: require('./db/private/models/users')
  },
  public: {}
};