const BaseService = require('../common/service.js');

class Service extends BaseService {

  find(query) {
    if (!query) throw new Error('Query is invalid');

    return super.find(query).first(
      'name',
      'notification_threshold_percent AS notificationThresholdPercent',
      'notification_threshold_timeframe AS notificationThresholdTimeframe',
      'region_coordinates AS regionCoordinates',
      'api_endpoint_url AS apiEndpointUrl',
      'reference_website_url AS referenceWebsiteUrl',
      'info_website_url AS infoWebsiteUrl',
      'privacy_policy_url AS privacyPolicyUrl',
    );
  }

}

module.exports = new Service('organizations');
