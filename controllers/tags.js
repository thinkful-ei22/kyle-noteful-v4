'use strict';

const mongoose = require('mongoose');
const Tag = require('../models/tag');
const Note = require('../models/note');

const tagsListGet = function (req, res, next) {
  const userId = req.user.id;

  const filter = { userId };

  Tag.find(filter)
    .sort('name')
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
};

const tagDetailsGet = function (req, res, next) {
  const { id } = req.params;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  let filter = { _id: id, userId };

  Tag.findOne(filter)
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
};

const tagCreatePost = function (req, res, next) {
  const { name } = req.body;
  const userId = req.user.id;

  const newTag = { name, userId };

  /***** Never trust users - validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  Tag.create(newTag)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Tag name already exists');
        err.status = 400;
      }
      next(err);
    });
};

const tagDetailsPut = function (req, res, next) {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const filter = { _id: id, userId };
  const updateTag = { name, userId };

  Tag.findOneAndUpdate(filter, updateTag, { new: true })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Tag name already exists');
        err.status = 400;
      }
      next(err);
    });
};

const tagDetailsDelete = function (req, res, next) {
  const { id } = req.params;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  const tagFilter = { _id: id, userId };
  const tagRemovePromise = Tag.deleteOne(tagFilter);

  const noteUpdatePromise = Note.updateMany(
    { tags: id, userId },
    { $pull: { tags: id } }
  );

  Promise.all([tagRemovePromise, noteUpdatePromise])
    .then(() => {
      res.sendStatus(204).end();
    })
    .catch(err => {
      next(err);
    });
};

module.exports = {
  tagsListGet,
  tagDetailsGet,
  tagCreatePost,
  tagDetailsPut,
  tagDetailsDelete
};