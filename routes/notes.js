'use strict';

const express = require('express');
const passport = require('passport');
const {
  notesListGet,
  noteDetailsGet,
  noteCreatePost,
  noteDetailsPut,
  noteDetailsDelete
} = require('../controllers/notes');

const router = express.Router();

const authOptions = { session: false, failWithError: true };
const jwtAuth = passport.authenticate('jwt', authOptions);
router.use('/', jwtAuth);

router.route('/')
  .get(notesListGet)
  .post(noteCreatePost);

router.route('/:id')
  .get(noteDetailsGet)
  .put(noteDetailsPut)
  .delete(noteDetailsDelete);

module.exports = router;