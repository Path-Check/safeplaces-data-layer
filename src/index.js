let privateService = {
  accessCodeService: require("./db/public/models/accessCodes"),
  caseService: require("./db/private/models/cases"),
  organizationService: require("./db/private/models/organizations"),
  pointService: require("./db/private/models/points"),
  publicationService: require("./db/private/models/publications"),
  publicOrganizationService: require("./db/private/models/publicOrganizations"),
  settingService: require("./db/private/models/settings"),
  uploadService: require("./db/private/models/upload"),
  userService: require("./db/private/models/users"),
};

let publicService = {
  accessCodeService: require("./db/public/models/accessCodes"),
  organizationService: require("./db/public/models/organizations"),
  pointService: require("./db/public/models/points"),
};

if (process.env.SERVICE_NAME === "INGEST") privateService = null;

module.exports = {
  private: privateService,
  public: publicService,
};
