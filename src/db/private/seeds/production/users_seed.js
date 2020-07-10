exports.seed = function (knex) {
  return knex('users')
    .del()
    .then(async function () {
      await knex('users').insert({
        id: '14718564-f521-4079-8e1b-23694290fc09',
        idm_id: 'auth0|5ef53cdcf3ce32001a40ede7',
        organization_id: 1,
        username: 'safeplaces@extremesolution.com',
      });

      await knex('users').insert({
        id: '235ed8c0-96bf-4061-b3d4-8a90b2f59585',
        idm_id: 'auth0|5f089f59db607c001385b8f3',
        organization_id: 1,
        username: 'tracer@extremesolution.com',
      });
    });
};
