process.env.NODE_ENV = "test";

const expect = require("chai").expect;
// const should = chai.should(); // eslint-disable-line

const mockData = require('../lib/mockData.js')

const { private: { pointService } } = require('../../src')

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

  describe('create points from upload point', () => {

    // it("returns properly formatted point", async () => {
    //   const point = {
    //     longitude: 23.183994,
    //     latitude: -72.318221,
    //     time: "2020-06-12T13:00:00-04:00",
    //     duration: 10
    //   }

    //   const results = await pointService.createRedactedPoint(currentCase.caseId, point)
  
    //   expect(results.id).to.be.a('number');
    //   expect(results.publishDate).to.be.equal(null);
    //   expect(results.caseId).to.be.equal(currentCase.caseId);
    //   expect(results.longitude).to.be.equal(23.183994);
    //   expect(results.latitude).to.be.equal(-72.318221);
    //   expect(results.duration).to.be.equal(10);
    //   expect(results.nickname).to.be.null;
    // });

    // it("pulls new point from database and checks fields", async () => {
    //   const point = {
    //     longitude: 23.183914,
    //     latitude: -72.318121,
    //     time: "2020-06-14:00:00-04:00",
    //     duration: 5
    //   }

    //   const results = await pointService.createRedactedPoint(currentCase.caseId, point)
    //   const foundPoint = await pointService.findOne({ id: results.id })

    //   expect(foundPoint.hash).to.be.equal(null);
    //   expect(foundPoint.coordinates).to.be.a('string');
    //   expect(foundPoint.coordinates).to.be.equal('0101000020E6100000CC46E7FC142F3740EFCA2E185C1452C0');
    // });

  });

  describe('update point', () => {

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
  });
});
