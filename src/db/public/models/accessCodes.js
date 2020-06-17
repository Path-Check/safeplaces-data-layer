const BaseService = require('../common/service.js');
const knex = require('../knex.js');

class Service extends BaseService {

  async find(query) {
    if (!query) throw new Error('Query is invalid');

    return super.find(query).first(
      'id',
      'value',
      'upload_consent',
      knex.raw('COALESCE(invalidated_at, NOW()) >= NOW() AS valid'),
    );
  }

  async updateUploadConsent(code, consent) {
    if (!code || !code.id) throw new Error('Query is invalid');
    if (consent == null) throw new Error('Consent is missing');

    await this.updateOne(code.id, {
      upload_consent: consent,
    });

    code.upload_consent = consent;
  }

  async invalidate(code) {
    if (!code || !code.id) throw new Error('Query is invalid');

    await this.updateOne(code.id, {
      invalidated_at: knex.fn.now(),
    });

    code.valid = false;
  }

}

module.exports = new Service('access_codes');
