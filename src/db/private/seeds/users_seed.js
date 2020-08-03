module.exports = function (knex) {
  return knex('users')
    .del() // Deletes ALL existing entries
    .then(async function () {
      await knex('users').insert({
        id: 'c317216f-70b0-4538-a03e-88388beca810',
        idm_id: 'auth0|5f1f0f23d93c10003dcb07cf',
        organization_id: 1,
        username: 'superuser@extremesolution.com',
      });

      await knex('users').insert({
        id: '14718564-f521-4079-8e1b-23694290fc09',
        idm_id: 'auth0|5f246391675616003785f947',
        organization_id: 1,
        username: 'safeplaces@extremesolution.com',
      });

      await knex('users').insert({
        id: '235ed8c0-96bf-4061-b3d4-8a90b2f59585',
        idm_id: 'auth0|5f1f0f32314999003d05021e',
        organization_id: 1,
        username: 'tracer@extremesolution.com',
      });
    });
};
