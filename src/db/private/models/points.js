const BaseService = require('../../common/service.js');

const Buffer = require('buffer').Buffer;

const knex = require('../../knex.js').private;
const knexPostgis = require("knex-postgis");
const wkx = require('wkx');

const st = knexPostgis(knex);

class Service extends BaseService {

  /**
   * Fetch All Points and run through Redaction.
   *
   * @method fetchRedactedPoints
   * @param {Array} case_ids
   * @return {Array}
   */
  async fetchRedactedPoints(case_ids) {
    if (!case_ids) throw new Error('Case IDs is invalid')

    const points = await this.table.whereIn('case_id', case_ids)
    if (points) {
      return this.getRedactedPoints(points)
    }
    throw new Error('Could not find redacted points.')
  }

  /**
   * Create individual point
   *
   * @method createPointsFromUpload
   * @param {Number} caseId
   * @param {Object} point
   * @param {Float} point.longitude
   * @param {Float} point.latitude
   * @param {Timestamp} point.time
   * @param {String} point.nickname
   * @return {Object}
   */
  async createRedactedPoint(caseId, point) {
    let record = {
      hash: null,
      coordinates: this.makeCoordinate(point.longitude, point.latitude),
      time: new Date(point.time), // Assumes time in epoch seconds
      case_id: caseId,
      duration: point.duration,
      nickname: point.nickname,
    };
    const points = await this.create(record);
    if (points) {
      return this.getRedactedPoints(points).shift()
    }
    throw new Error('Could not create hash.')
  }

  /**
   * Create points from upload
   *
   * @method createPointsFromUpload
   * @param {String} caseId
   * @param {Array} uploadedPoints
   * @return {Object}
   */
  async createPointsFromUpload(caseId, uploadedPoints) {
    if (!caseId) throw new Error('Case ID is invalid');
    if (!uploadedPoints) throw new Error('Uploaded points are invalid');

    const records = uploadedPoints.map(point => {
      return {
        hash: point.hash,
        coordinates: point.coordinates,
        time: new Date(point.time),
        upload_id: uploadedPoints[0].upload_id,
        duration: point.duration,
        case_id: caseId,
      }
    });

    const points = await this.create(records);
    if (!points) {
      throw new Error('Could not create points.');
    }

    return this.getRedactedPoints(points);
  }

  /**
   * Format a given poiint to a stored redacted point.
   *
   * @method updateRedactedPoint
   * @param {String} point_id
   * @param {String} point.hash
   * @param {Float} point.longitude
   * @param {Float} point.latitude
   * @param {Timestamp} point.time
   * @param {String} point.nickname
   * @return {Object}
   */
  async updateRedactedPoint(point_id, point) {
    let record = {
      hash: point.hash,
      coordinates: this.makeCoordinate(point.longitude, point.latitude),
      time: new Date(point.time),
      duration: point.duration,
      ...(point.nickname && { nickname: point.nickname })
    };

    const points = await this.updateOne(point_id, record);
    if (points) {
      return this.getRedactedPoints([points]).shift()
    }
    throw new Error('Could not create hash.')
  }

  /**
   * Update metadata on a set of points.
   *
   * @method updateRedactedPoint
   * @param {Array} point_ids
   * @param {Float} params.nickname
   * @return {Array}
   */
  async updateRedactedPoints(point_ids, params) {
    if (!point_ids) throw new Error('Invalid point ids');
    if (!params) throw new Error('Invalid point_ids');

    const points = await this.table.whereIn('id', point_ids).update(params).returning('*');

    if (points) {
      return this.getRedactedPoints(points);
    }
    throw new Error('Could not update points.');
  }

  /**
   * Filter all Points and return redacted information
   *
   * @method getRedactedPoints
   * @param {String} case_id
   * @param {Options} Options
   * @return {Array}
   */
  getRedactedPoints(points, includeHash = false, returnDateTime = true) {
    let redactedTrail = [];

    points.forEach(point => {
      let trail = {};
      const b = new Buffer.from(point.coordinates, 'hex');
      const c = wkx.Geometry.parse(b);
      trail.id = point.id;
      trail.publishDate = point.publishDate || point.publish_date || null;
      trail.caseId = point.caseId || point.case_id || null;
      trail.pointId = point.pointId || point.id || null;
      trail.longitude = c.x;
      trail.latitude = c.y;
      trail.duration = point.duration;
      trail.nickname = point.nickname || null;
      if (includeHash) trail.hash = point.hash;
      trail.time = (point.time.getTime() / 1000);
      if (returnDateTime) trail.time = point.time;
      redactedTrail.push(trail);
    });

    return redactedTrail;
  }

  makeCoordinate(longitude, latitude) {
    return st.setSRID(
      st.makePoint(longitude, latitude),
      4326
    );
  }

  deleteIds(ids) {
    if (!ids) throw new Error('Invalid point ids');
    return this.table.whereIn('id', ids).del();
  }

  // Testing - Mock Data Only

  /**
   * Insert a group of points with redacted data.
   * MOCK DATA ONLY - TESTINGS
   *
   * @method insertRedactedTrailSet
   * @param {Array} trails
   * @param {Number} caseId
   * @return {Array}
   */
  async insertRedactedTrailSet(trails, caseId) {
    const trailRecords = trails.map(trail => {
      return {
        hash: null,
        coordinates: this.makeCoordinate(trail.longitude, trail.latitude),
        time: new Date(trail.time * 1000), // Assumes time in epoch seconds
        case_id: caseId,
        duration: trail.duration
      }
    })

    return this.create(trailRecords);
  }

  /**
   * Needed to generate Hashes and timestamps of postgis for sinon stubs in tests.
   * MOCK DATA ONLY - TESTINGS
   *
   * @method fetchTestHash
   * @param {Number} longitude
   * @param {Number} latitude
   * @return {Object}
   */
  async fetchTestHash(longitude, latitude) {
    const results = await this.raw(`SELECT ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}),4326) AS point, now() AS time`);
    if (results) {
      return results.rows[0];
    }
    return null;
  }

}

module.exports = new Service('points');
