'use strict';

const express = require('express');

const User = require('../models/user');

const router = express.Router();

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const { fullname, username, password } = req.body;

  const requiredFields = ['username', 'password'];
  const missingField = requiredFields.find(field => !(field in req.body));
  
  if (missingField) {
    const err = new Error(`Missing ${missingField} in request body`);
    err.status = 400;
    return next(err);
  }

  const explicitlyTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicitlyTrimmedFields.find(field => {
    return req.body[field].trim() !== req.body[field];
  });
  
  if (nonTrimmedField) {
    const err = new Error(
      `The \`${nonTrimmedField}\` cannot begin or end with whitespace`
    );
    err.status = 400;
    return next(err);
  }

  const stringFields = ['username', 'password', 'fullname'];
  const nonStringField = stringFields.find(field => {
    return req.body[field] && typeof req.body[field] !== 'string';
  });
  
  if (nonStringField) {
    const err = new Error(`The \`${nonStringField}\` must be of type \`string\``);
    err.status = 400;
    return next(err);
  }

  const sizedFields = {
    username: {
      min: 1
    },
    password: {
      min: 8,
      max: 72
    }
  };
  const tooShortField = Object.keys(sizedFields).find(
    field => 
      'min' in sizedFields[field] &&
        req.body[field].trim().length < sizedFields[field].min
  );
  const tooLongField = Object.keys(sizedFields).find(
    field =>
      'max' in sizedFields[field] &&
        req.body[field].trim().length > sizedFields[field].max
  );

  if (tooShortField || tooLongField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: tooShortField
        ? `Must be at least ${sizedFields[tooShortField]
          .min} characters long`
        : `Must be at most ${sizedFields[tooLongField]
          .max} characters long`,
      location: tooShortField || tooLongField
    });
  }


  return User.hashPassword(password)
    .then(digest => {
      const newUser = {
        username,
        password: digest,
        fullname
      };
      return User.create(newUser);
    })
    .then(result => {
      return res
        .location(`${req.originalUrl}/${result.id}`)
        .status(201)
        .json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('That username already exists');
        err.status = 400;
      }
      next(err);
    });
});


module.exports = router;