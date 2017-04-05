const User = require('./userModel');

const userController = {}

userController.getAllUsers = function (req, res) {
  console.log("getAllUsers fires off")
  User.find({}, (err, results) => {
    if (err) {
      console.log('find all users error', err);
      return res.end();
    }
    return res.status(200).json(results);
  });
}

userController.createUser = function (req, res) {
  console.log("dis iz req body", req.body);
  User.create(req.body, (err, userRecord) => {
    if (err) {
      console.log('create user error', err);
      return res.status(500).end();
    }
    console.log('user created');
    return res.status(200).end();
  });
}

userController.getUser =function(req, res) {
  const user = req.params.user;
  User.findOne({ user: user }, (err, results) => {
    if (results === null) {
      return res.status(418).json(err);
    } else {
      return res.status(200).json(results);
    }
  });
}

userController.updateUser = function (req, res) {
  const user = req.params.user;
  const newNotes = req.body.notes;
  console.log(req.body);

  User.update(
    { user: user },
    {
      $set: {
        notes: newNotes
      }
    },
    {
      'upsert': true
    }, function (err, result) {
      if (err) {
        return res.status(418).json(err);
      }
      console.log('updated!');
      return res.end();
    }
  )
}



module.exports = userController;
