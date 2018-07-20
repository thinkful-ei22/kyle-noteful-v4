'use strict';

const express = require('express');
const { userCreatePost } = require('../controllers/users');

const router = express.Router();

router.route('/')
  .post(userCreatePost);

module.exports = router;