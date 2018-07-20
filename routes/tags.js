'use strict';

const express = require('express');
const passport = require('passport');
const {
  tagsListGet,
  tagDetailsGet,
  tagCreatePost,
  tagDetailsPut,
  tagDetailsDelete
} = require('../controllers/tags');

const router = express.Router();

const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true });
router.use('/', jwtAuth);

router.route('/')
  .get(tagsListGet)
  .post(tagCreatePost);

router.route('/:id')
  .get(tagDetailsGet)
  .put(tagDetailsPut)
  .delete(tagDetailsDelete);

module.exports = router;