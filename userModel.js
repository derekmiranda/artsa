const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  user: {type: String, required: true},
  notes: {type: String},
  password: {type: String}
});

const userData = mongoose.model('User', userSchema);
module.exports = userData;