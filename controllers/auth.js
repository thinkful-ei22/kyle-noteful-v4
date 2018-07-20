'use strict';

const { createAuthToken } = require('../utils/auth');

const newJwtHandler = function (req, res) {
  const authToken = createAuthToken(req.user);
  return res.json({ authToken });
};

module.exports = { newJwtHandler };