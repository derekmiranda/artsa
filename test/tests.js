const db = require('../userController.js');
const fs = require('fs');
const path = require('path');
const sinon = require('sinon')
const testJsonFile = path.join(__dirname, './test/db.test.json');
const chai = require('chai');
const expect = chai.expect

describe('db unit tests', () => {
  // Mocha runs the "before" function once, before any tests are executed.
  // If you need to perform an asynchronous operation during a Mocha function, then
  // you have two options. One is to return a promise and Mocha will honor that promise,
  // not continuing to the next step until the Promise is resolved. The second way is
  // to provide a callback function named "done" (the approach I'm using below).
  // If you provide the callback, then Mocha will not move on to the next step until
  // the "done" callback has been called. Here, I'm passing "done" directly to the
  // fs.writeFile function which will call done as soon as the file has been written.
  // This way, the tests won't start until the "database" file has been reset to an empty Array!
  beforeEach(() => {
    // Make sure "db" is empty
    fs.writeFileSync(testJsonFile, JSON.stringify([], null, 2));
    db.reset();
  });

})