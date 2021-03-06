const _ = require('lodash');
const BaseService = require('../../common/service.js');
const geoHash = require('../../../lib/geoHash');

const pointsService = require('./points');

class Service extends BaseService {
  /**
   * Mark Case Published
   *
   * @method publish
   * @param {Array} caseIds
   * @param {String} organizationId
   * @return {Array}
   */
  async publishCases(caseIds, organizationId) {
    if (!caseIds) throw new Error('Case IDs are invalid');
    if (!caseIds.length) throw new Error('Case IDs length is zero');
    if (!organizationId) throw new Error('Organization ID is not valid');

    const stagedCases = await this.table
      .whereIn('id', caseIds)
      .andWhere('organization_id', organizationId)
      .andWhere('state', 'staging')
      .select();

    if (stagedCases.length === caseIds.length) {
      const newlyPublishedCases = await this.table
        .whereIn('id', caseIds)
        .update({ state: 'published' })
        .returning('*');

      await this._hashAndSavePoints(caseIds);

      if (newlyPublishedCases) {
        const results = await this.table
          .where('state', 'published')
          .andWhere('expires_at', '>', new Date())
          .select();

        if (results) {
          return _.map(results, c => this._mapCase(c));
        } else {
          throw new Error('Could not locate any unexpired published cases.');
        }
      } else {
        throw new Error('Unable to publish cases at this time.');
      }
    } else {
      throw new Error(
        `Could not locate staged cases with caseIds ${caseIds}. Make sure all are moved into staging state.`,
      );
    }
  }

  /**
   * Consent To Publish
   *
   * @method consentToPublishing
   * @param {Number} case_id
   * @return {Object}
   */
  async consentToPublishing(case_id) {
    const result = await this.updateOne(case_id, {
      consented_to_publishing_at: this.database.fn.now(),
    });
    if (result) {
      return this._mapCase(result);
    }
  }

  /**
   * Mark Case Staging
   *
   * @method moveToStaging
   * @param {Number} case_id
   * @return {Object}
   */
  async moveToStaging(case_id) {
    const results = await this.updateOne(case_id, {
      state: 'staging',
      staged_at: this.database.fn.now(),
    });

    if (results) {
      return this._mapCase(results);
    }
  }

  /**
   * Mark Case Unpublished
   *
   * @method unpublish
   * @param {Number} case_id
   * @return {Object}
   */
  async unpublish(case_id) {
    const results = await this.updateOne(case_id, { state: 'unpublished' });
    if (results) {
      return this._mapCase(results);
    }
  }

  /**
   * Create Case
   *
   * @method stage
   * @param {Object} options
   * @param {Number} options.organization_id
   * @param {Timestamp} options.expires_at
   * @return {Object}
   */
  async createCase(options = null) {
    if (!options.organization_id) throw new Error('Organization ID is invalid');
    if (!options.expires_at) throw new Error('Expires at Date is invalid');

    const cases = await this.create(options);

    if (cases) {
      return this._mapCase(cases.shift());
    }

    throw new Error('Could not create the case.');
  }

  /**
   * Get All Cases in Descending order
   *
   * @method fetchAll
   * @param {Number} organization_id
   * @return {Array}
   */
  async fetchAll(organization_id) {
    const cases = await this.table
      .where({ organization_id })
      .orderBy('created_at', 'desc')
      .select();

    if (cases) {
      return _.map(cases, c => this._mapCase(c));
    }

    return [];
  }

  /**
   * Update Case Publication Id
   *
   * @method updateCasePublicationId
   * @param {Number} id
   * @return {Array}
   */
  updateCasePublicationId(ids, publication_id) {
    if (!ids) throw new Error('IDs are invalid');
    if (!ids.length === 0) throw new Error('IDs have an invalid length');
    if (!publication_id) throw new Error('Publication ID is invalid');

    const results = this.table.whereIn('id', ids).update({ publication_id });

    if (results) {
      return this._mapCase(results);
    }
  }

  /**
   * Fetch all case points associated with a case
   *
   * @method fetchCasePoints
   * @param {Number} case_id
   * @return {Array}
   */
  async fetchCasePoints(case_id) {
    if (!case_id) throw new Error('Case ID is invalid.');

    const points = await pointsService.fetchRedactedPoints([case_id]);
    if (points) {
      return points;
    }
    return [];
  }

  /**
   * Fetch all case points associated with a group cases
   *
   * @method fetchCasesPoints
   * @param {Array} case_ids
   * @return {Array}
   */
  async fetchCasesPoints(case_ids) {
    if (!case_ids) throw new Error('Case IDs is invalid.');

    const points = await pointsService.fetchRedactedPoints(case_ids);
    if (points) {
      return points;
    }
    return [];
  }

  /**
   * Create case point
   *
   * @method createCasePoint
   * @param {Number} case_id
   * @param {Object} point
   * @return {Object}
   */
  createCasePoint(case_id, point) {
    if (!case_id) throw new Error('Case ID is invalid');
    if (!point) throw new Error('Point is invalid');

    return pointsService.createRedactedPoint(case_id, point);
  }

  /**
   * Delete cases that have expired.
   *
   * @method deleteCasesPastRetention
   * @param {Number} organization_id
   * @return {Object}
   */
  async deleteCasesPastRetention(organization_id) {
    if (!organization_id) throw new Error('Organization ID is invalid');

    const casesToDelete = await this.table
      .where({ organization_id: organization_id })
      .where('expires_at', '<=', new Date());

    const caseIdsToDelete = _.map(casesToDelete, 'id');

    await pointsService.table.whereIn('case_id', caseIdsToDelete).del();

    return this.table.whereIn('id', caseIdsToDelete).del();
  }

  /**
   * Fetch all points from cases that are published
   *
   * @method fetchAllPublishedPoints
   * @param {Number} case_id
   * @param {Object} point
   * @return {Object}
   */
  async fetchAllPublishedPoints() {
    const points = await this.table
      .select(
        'cases.id AS caseId',
        'publications.publish_date AS publishDate',
        'points.id AS pointId',
        'points.coordinates',
        'points.time',
        'points.hash',
      )
      .join('points', 'cases.id', '=', 'points.case_id')
      .join('publications', 'cases.publication_id', '=', 'publications.id')
      .where('cases.state', 'published')
      .where('cases.expires_at', '>', new Date());

    if (points) {
      return pointsService._getRedactedPoints(points, true, false);
    }

    return [];
  }

  /**
   * Update Case External Id
   *
   * @method updateCaseExternalId
   * @param {Number} id
   * @return {Object}
   */
  async updateCaseExternalId(case_id, external_id) {
    if (!case_id) throw new Error('ID is invalid');
    if (!external_id) throw new Error('External ID is invalid');

    const results = await this.updateOne(case_id, { external_id });
    if (results) {
      return this._mapCase(results);
    }
  }

  // private

  async _hashAndSavePoints(caseIds) {
    const newlyPublishedPoints = await pointsService.fetchRedactedPoints(
      caseIds,
    );

    let currentPoint;

    for (let i = 0; i < newlyPublishedPoints.length; i++) {
      currentPoint = newlyPublishedPoints[i];

      if (currentPoint.hash) {
        continue;
      } // don't hash points if they are already

      let hash = await geoHash.encrypt(currentPoint);
      let pointParams = {
        ..._.omit(currentPoint, ['id', 'pointId', 'hash']),
        hash: hash.encodedString,
      };

      await pointsService.updateRedactedPoint(currentPoint.id, pointParams);
    }

    return;
  }

  _mapCase(itm) {
    itm.caseId = itm.id;
    itm.updatedAt = itm.updated_at;
    itm.stagedAt = itm.staged_at;
    itm.expiresAt = itm.expires_at;
    itm.externalId = itm.external_id;
    itm.contactTracerId = itm.contact_tracer_id;
    delete itm.organization_id;
    delete itm.publication_id;
    delete itm.contact_tracer_id;
    delete itm.updated_at;
    delete itm.staged_at;
    delete itm.expires_at;
    delete itm.created_at;
    delete itm.consented_to_publishing_at;
    delete itm.external_id;
    delete itm.id;
    return itm;
  }
}

module.exports = new Service('cases');
