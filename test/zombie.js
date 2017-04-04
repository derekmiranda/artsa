const zombie = require('zombie');
require('../server'); 

describe('user visits the main page', function(){
  before(function(done){
    zombie.visit('http://localhost:3000')
  })
})