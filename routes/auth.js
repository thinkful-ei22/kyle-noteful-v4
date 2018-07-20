'use strict';

const express = require('express');
const passport = require('passport');
const { newJwtHandler } = require('../controllers/auth');

const router = express.Router();

const authOptions = { session: false, failWithError: true };
const localAuth = passport.authenticate('local', authOptions);
const jwtAuth = passport.authenticate('jwt', authOptions);

router.post('/login', localAuth, newJwtHandler);

router.post('/refresh', jwtAuth, newJwtHandler);

module.exports = router;