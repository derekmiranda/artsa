const db = require('../userController.js');
const fs = require('fs');
const path = require('path');
const sinon = require('sinon')
const testJsonFile = path.join(__dirname, '/db.test.json');
const expect = require('expect')
const mongoose = require('mongoose')
const request = require('supertest')
const host = 'http://localhost:3000'
let jsonData;


// describe("route tests", () => {
//   beforeEach(done => {
//     if ('should respond with ')
//       request(host).get('/check').expect(200, (err, response) => {
//         //jsonData = response.body;
//         //console.log(jsonData)
//         done();
//       })

//   })

  describe('/', function () {
    it('respond with text html', function (done) {
      request(host)
        .get('/')
        .expect('Content-Type', 'text/html; charset=UTF-8')
        .expect(200, done);
    });
  });

  describe('/create', function () {
    it('it should respond with status code 200', function (done) {
      request(host)
        .get('/create')
        .expect(200, function (err) {
        })
      done()

    });
  });

  describe('/create', function () {
    it('it should respond with status code 200', function (done) {
      request(host)
        .post('/create')
        .send({user:"joeljoel", notes: "strings"})
        .expect(200, done)
        // .end(function (err, res) {
        // })
    });
  });

  describe('/rooms/:room', function () {
    it('should respond with status code 200', function (done) {
      request(host)
        .get('/rooms/:room')
        .expect(200, function (err) {

        })
      done();
    })
  })

  describe('/notes/:user', function () {
    it('should respond with status coded 200', function (done) {
      request(host)
        .get('/notes/:user')
        .expect(200, function (err) {

        })
      done()
    })
  })

  describe('/notes/:user', function () {
    it('should respond with notes from the user', function (done) {
      request(host)
        .post('/notes/:user')
        .expect(200, function (err) {

        })
      done()
    })
  })
  // describe('get to check', () => {
  //   it('should add something to the database', (done) => {
  //     console.log(jsonData.length)
  //     db.createUser();
  //     conosle.log(jsonData.length)
  //     done();
  //   })
  // })
// })
