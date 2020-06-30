process.env.NODE_ENV = "test";

const expect = require("chai").expect;
// const should = chai.should(); // eslint-disable-line
const { v4: uuidv4 } = require('uuid');

const mockData = require('../lib/mockData.js')

const { private: { pointService, uploadService }, public: { pointService: publicPointService } } = require('../../src')

let currentOrg, currentUser, currentCase;

describe("Points", () => {

  before(async () => {
    await mockData.clearMockData()

    let orgParams = {
      name: 'My Example Organization',
      info_website_url: 'http://sample.com',
    };
    currentOrg = await mockData.mockOrganization(orgParams);

    let newUserParams = {
      username: 'myAwesomeUser',
      password: 'myAwesomePassword',
      email: 'myAwesomeUser@yomanbob.com',
      organization_id: currentOrg.id,
    };
    currentUser = await mockData.mockUser(newUserParams); // eslint-disable-line

    const caseParams = {
      organization_id: currentOrg.id,
      state: 'published'
    };
    currentCase = await mockData.mockCase(caseParams)
  });

  describe('fetch redacted points for case', () => {

    before(async () => {
      const point = {
        longitude: 23.183994,
        latitude: -72.318221,
        time: "2020-06-12T13:00:00-04:00",
        duration: 10
      }
      await pointService.createRedactedPoint(currentCase.caseId, point)
    })

    it("returns properly formatted points for a case", async () => {
      const results = await pointService.fetchRedactedPoints([currentCase.caseId])

      expect(results).to.be.a('array');
      expect(results[0].caseId).to.be.equal(currentCase.caseId);
    });

    it("pulls new point from database and checks fields", async () => {
      const point = {
        longitude: 23.183914,
        latitude: -72.318121,
        time: "2020-06-14:00:00-04:00",
        duration: 5
      }

      const results = await pointService.createRedactedPoint(currentCase.caseId, point)
      const foundPoint = await pointService.findOne({ id: results.id })

      expect(foundPoint.hash).to.be.equal(null);
      expect(foundPoint.coordinates).to.be.a('string');
      expect(foundPoint.coordinates).to.be.equal('0101000020E6100000CC46E7FC142F3740EFCA2E185C1452C0');
    });

  });

  describe('create redacted point', () => {

    it("returns properly formatted point", async () => {
      const point = {
        longitude: 23.183994,
        latitude: -72.318221,
        time: "2020-06-12T13:00:00-04:00",
        duration: 10
      }

      const results = await pointService.createRedactedPoint(currentCase.caseId, point)
  
      expect(results.id).to.be.a('number');
      expect(results.publishDate).to.be.equal(null);
      expect(results.caseId).to.be.equal(currentCase.caseId);
      expect(results.longitude).to.be.equal(23.183994);
      expect(results.latitude).to.be.equal(-72.318221);
      expect(results.duration).to.be.equal(10);
      expect(results.nickname).to.be.null;
    });

    it("pulls new point from database and checks fields", async () => {
      const point = {
        longitude: 23.183914,
        latitude: -72.318121,
        time: "2020-06-14:00:00-04:00",
        duration: 5
      }

      const results = await pointService.createRedactedPoint(currentCase.caseId, point)
      const foundPoint = await pointService.findOne({ id: results.id })

      expect(foundPoint.hash).to.be.equal(null);
      expect(foundPoint.coordinates).to.be.a('string');
      expect(foundPoint.coordinates).to.be.equal('0101000020E6100000CC46E7FC142F3740EFCA2E185C1452C0');
    });

  });

  describe('create points from upload points', () => {

    let currentAccessCode, uploadedPoints

    before(async () => {
      const uploadPoints = [{
        longitude: 14.91328448,
        latitude: 41.24060321,
        time: 1589117739000,
      }];

      const uploadId = uuidv4();
      currentAccessCode = await mockData.mockAccessCode();
      await publicPointService.createMany(uploadPoints, currentAccessCode, uploadId)

      uploadedPoints = await uploadService.fetchPoints(currentAccessCode);
    })

    it("returns point generated above with hash", async () => {
      expect(uploadedPoints).to.be.a('array');
      expect(uploadedPoints[0]).to.be.a('object');
      expect(uploadedPoints[0].id).to.be.a('number');
      expect(uploadedPoints[0].upload_id).to.be.a('string');
      expect(uploadedPoints[0].coordinates).to.be.a('string');
      expect(uploadedPoints[0].hash).to.be.a('string');
    });

    it("saves uploaded points", async () => {      
      const points = await pointService.createPointsFromUpload(currentCase.caseId, uploadedPoints)

      expect(points).to.be.a('array');
      expect(points[0]).to.be.a('object');
      expect(points[0].caseId).to.be.equal(currentCase.caseId);
      expect(points[0].pointId).to.be.a('number');
      expect(points[0].longitude).to.be.a('number');
      expect(points[0].latitude).to.be.a('number');
      expect(points[0].duration).to.be.equal(5);
    });
  });

  describe('update a point', () => {

    let currentAccessCode, updatePoint

    before(async () => {
      const uploadPoints = [{
        longitude: 14.91328448,
        latitude: 41.24060321,
        time: 1589117739000,
      }];

      const uploadId = uuidv4();
      currentAccessCode = await mockData.mockAccessCode();
      await publicPointService.createMany(uploadPoints, currentAccessCode, uploadId)
      const uploadedPoints = await uploadService.fetchPoints(currentAccessCode);
      const points = await pointService.createPointsFromUpload(currentCase.caseId, uploadedPoints)
      updatePoint = points[0]
    })

    it("returns properly formatted updated point", async () => {
      const point = {
        longitude: 23.183994,
        latitude: -72.318221,
        time: "2020-06-12T13:05:00-04:00",
        duration: 10
      }

      const results = await pointService.updateRedactedPoint(updatePoint.id, point)
 
      expect(results).to.be.a('object');
      expect(results.publishDate).to.be.equal(null);
      expect(results.caseId).to.be.equal(currentCase.caseId);
      expect(results.longitude).to.be.equal(23.183994);
      expect(results.latitude).to.be.equal(-72.318221);
      expect(results.duration).to.be.equal(10);
    });
  });

  describe('update multiple points', () => {

    let currentAccessCode, points

    before(async () => {
      const uploadPoints = [
        {
          longitude: 14.91328448,
          latitude: 41.24060321,
          time: 1589117739000,
        }, {
          longitude: 23.183994,
          latitude: -72.318221,
          time: ((1589117739-3600) * 1000),
        }
      ];

      const uploadId = uuidv4();
      currentAccessCode = await mockData.mockAccessCode();
      await publicPointService.createMany(uploadPoints, currentAccessCode, uploadId)
      const uploadedPoints = await uploadService.fetchPoints(currentAccessCode);
      points = await pointService.createPointsFromUpload(currentCase.caseId, uploadedPoints)
    })

    it("returns properly formatted updated point", async () => {
      const pointIds = points.map(itm => itm.id)
      const results = await pointService.updateRedactedPoints(pointIds, { nickname: 'Hello world' })

      expect(results).to.be.a('array');

      results.forEach(itm => {
        expect(itm).to.be.a('object');
        expect(itm.nickname).to.be.equal('Hello world');
      })
    });
  });
});
