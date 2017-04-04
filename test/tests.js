const db = require('../userController.js');
const fs = require('fs');
const path = require('path');
const sinon = require('sinon')
const testJsonFile = path.join(__dirname, '/db.test.json');
const chai = require('chai');
const expect = require('expect')
const mongoose = require('mongoose')
const request = require('supertest')
const host = 'http://localhost:3000'

let jsonData;


describe("route tests", () => {
  beforeEach(done => {
    request(host).get('/check').expect(200, (err, response) => {
      jsonData = response.body;
      done();
    })

  })
  describe('get to check', () => {
    it('should console.log something', (done) => {
      console.log("is the jsonData console.logging", jsonData)
      done();
    })
  })
})
