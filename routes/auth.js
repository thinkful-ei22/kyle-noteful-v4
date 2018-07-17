'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const { JWT_SECRET, JWT_EXPIRY } = require('../config');

const router = express.Router();

const createAuthToken = function(user) {
  return jwt.sign({ user }, JWT_SECRET, {
    subject: user.username,
    expiresIn: JWT_EXPIRY
  });
};

const options = { session: false, failWithError: true };
const localAuth = passport.authenticate('local', options);
const jwtAuth = passport.authenticate('jwt', options);

router.post('/login', localAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  return res.json({ authToken });
});

router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  return res.json({ authToken });
});


module.exports = router;