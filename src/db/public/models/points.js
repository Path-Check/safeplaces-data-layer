const BaseService = require('../common/service.js');
const knex = require('../knex.js');
const knexPostgis = require("knex-postgis");

const st = knexPostgis(knex);

class Service extends BaseService {

  async createMany(points, accessCode, uploadId) {
    if (!points) throw new Error('Points are invalid');
    if (!accessCode || !accessCode.id) throw new Error('Access code is invalid');
    if (!uploadId) throw new Error('Upload ID is invalid');

    const pointRecords = [];

    for(let point of points) {
      const record = {
        access_code_id: accessCode.id,
        upload_id: uploadId,
        time: new Date(point.time), // Assumes time in epoch milliseconds
        coordinates: st.setSRID(
          st.makePoint(point.longitude, point.latitude),
          4326
        ),
      };

      pointRecords.push(record);
    }

    return this.create(pointRecords);
  }

}

module.exports = new Service('points');
