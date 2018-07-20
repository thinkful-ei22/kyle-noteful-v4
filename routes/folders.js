'use strict';

const express = require('express');
const passport = require('passport');
const {
  foldersListGet,
  folderDetailsGet,
  folderDetailsPut,
  folderDetailsDelete,
  folderCreatePost
} = require('../controllers/folders');

const router = express.Router();

const authOptions = { session: false, failWithError: true };
const jwtAuth = passport.authenticate('jwt', authOptions);

router.use('/', jwtAuth);

router.route('/')
  .get(foldersListGet)
  .post(folderCreatePost);

router.route('/:id')
  .get(folderDetailsGet)
  .put(folderDetailsPut)
  .delete(folderDetailsDelete);

module.exports = router;
