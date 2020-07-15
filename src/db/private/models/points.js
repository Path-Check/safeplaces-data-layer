const BaseService = require('../../common/service.js');
const Buffer = require('buffer').Buffer;

const knex = require('../../knex.js').private;
const knexPostgis = require('knex-postgis');
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
    if (!case_ids) throw new Error('Case IDs is invalid');

    const points = await this.table.whereIn('case_id', case_ids);
    if (points) {
      return this._getRedactedPoints(points);
    }
    throw new Error('Could not find redacted points.');
  }

  async createRedactedPoint(caseId, point) {
    let record = {
      coordinates: this.makeCoordinate(point.longitude, point.latitude),
      time: new Date(point.time), // Assumes time in epoch seconds
      case_id: caseId,
      nickname: point.nickname,
    };
    const points = await this.create(record);
    if (points) {
      return this._getRedactedPoints(points).shift();
    }
    throw new Error('Could not create point.');
  }

  async createPointsFromUpload(caseId, uploadedPoints) {
    if (!caseId) throw new Error('Case ID is invalid');
    if (!uploadedPoints) throw new Error('Uploaded points are invalid');

    const records = uploadedPoints.map(point => {
      return {
        coordinates: point.coordinates,
        time: new Date(point.time),
        upload_id: uploadedPoints[0].upload_id,
        case_id: caseId,
      };
    });

    const points = await this.create(records);
    if (!points) {
      throw new Error('Could not create points.');
    }

    return this._getRedactedPoints(points);
  }

  /**
   * Format a given poiint to a stored redacted point.
   *
   * @method updateRedactedPoint
   * @param {String} point_id
   * @param {Float} point.longitude
   * @param {Float} point.latitude
   * @param {Timestamp} point.time
   * @param {String} point.nickname
   * @return {Object}
   */
  async updateRedactedPoint(point_id, point) {
    let record = {
      coordinates: this.makeCoordinate(point.longitude, point.latitude),
      time: new Date(point.time),
      ...(point.hash && { hash: point.hash }),
      ...(point.nickname && { nickname: point.nickname }),
    };

    const points = await this.updateOne(point_id, record);
    if (points) {
      return this._getRedactedPoints([points]).shift();
    }
    throw new Error('Could not update point.');
  }

  /**
   * Update metadata on a set of points.
   *
   * @method updateRedactedPoints
   * @param {Array} point_ids
   * @param {Float} params.nickname
   * @return {Array}
   */
  async updateRedactedPoints(point_ids, params) {
    if (!point_ids) throw new Error('Invalid point ids');
    if (!params) throw new Error('Invalid point_ids');

    const points = await this.table
      .whereIn('id', point_ids)
      .update(params)
      .returning('*');

    if (points) {
      return this._getRedactedPoints(points);
    }
    throw new Error('Could not update points.');
  }

  makeCoordinate(longitude, latitude) {
    return st.setSRID(st.makePoint(longitude, latitude), 4326);
  }

  deleteIds(ids) {
    if (!ids) throw new Error('Invalid point ids');
    return this.table.whereIn('id', ids).del();
  }

  // private

  /**
   * Filter all Points and return redacted information
   *
   * @method _getRedactedPoints
   * @param {String} case_id
   * @param {Options} Options
   * @return {Array}
   */
  _getRedactedPoints(points) {
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
      trail.nickname = point.nickname || null;
      trail.time = point.time.getTime();
      trail.hash = point.hash;

      redactedTrail.push(trail);
    });

    return redactedTrail;
  }

  /**
   * Find cases in a specific time interval
   *
   * @method findIntervalCases
   * @param {Object} publication
   * @return {Array}
   */
  async findIntervalCases(publication) {
    if (!publication.start_date) throw new Error('Start date is invalid');
    if (!publication.end_date) throw new Error('End date is invalid');

    let cases = await this.table
      .select('case_id')
      .where('time', '>=', new Date(publication.start_date))
      .where('time', '<=', new Date(publication.end_date))
      .groupBy('case_id');
    if (cases) {
      return cases.map(c => c.case_id);
    }
    return [];
  }

  /**
   * Insert a group of points with redacted data.
   *
   * @method insertRedactedTrailSet
   * @param {Array} trails
   * @param {Number} caseId
   * @return {Array}
   */
  async insertRedactedTrailSet(trails, caseId) {
    const trailRecords = trails.map(trail => {
      return {
        coordinates: this.makeCoordinate(trail.longitude, trail.latitude),
        time: new Date(trail.time * 1000), // Assumes time in epoch seconds
        case_id: caseId,
      };
    });

    return this.create(trailRecords);
  }

  /**
   * Needed to generate Hashes and timestamps of postgis for sinon stubs in tests.
   *
   * @method loadTestRedactedTrails
   * @param {Number} longitude
   * @param {Number} latitude
   * @return {Object}
   */
  async fetchTestHash(longitude, latitude) {
    const results = await this.raw(
      `SELECT ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}),4326) AS point, now() AS time`,
    );
    if (results) {
      return results.rows[0];
    }
    return null;
  }
}

module.exports = new Service('points');
