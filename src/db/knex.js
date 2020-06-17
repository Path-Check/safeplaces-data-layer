var env = process.env.NODE_ENV || 'development';

module.exports = {
  public: require('knex')(require('../config/public.js')(env)),
  private: require('knex')(require('../config/private.js')(env)),
};
