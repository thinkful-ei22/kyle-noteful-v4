'use strict';

const mongoose = require('mongoose');
const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');

// HELPERS
const validateFolderId = function(folderId, userId) {
  if (folderId === undefined) {
    return Promise.resolve();
  }
  if (!mongoose.Types.ObjectId.isValid(folderId)) {
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return Promise.reject(err);
  }
  return Folder.countDocuments({ _id: folderId, userId })
    .then(count => {
      if (count === 0) {
        const err = new Error('The `folderId` is not valid');
        err.status = 400;
        return Promise.reject(err);
      }
    });
};

const validateTagIds = function(tags, userId) {
  if (tags === undefined) {
    return Promise.resolve();
  }
  if (!Array.isArray(tags)) {
    const err = new Error('The `tags` must be an array');
    err.status = 400;
    return Promise.reject(err);
  }
  return Tag.find({ $and: [{ _id: { $in: tags }, userId }] })
    .then(results => {
      if (tags.length !== results.length) {
        const err = new Error('The `tags` array contains an invalid id');
        err.status = 400;
        return Promise.reject(err);
      }
    });
};

// CONTROLLERS
const notesListGet = function (req, res, next) {
  const { searchTerm, folderId, tagId } = req.query;
  const userId = req.user.id;

  let filter = { userId };

  if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    filter.$or = [{ 'title': re }, { 'content': re }];
  }

  if (folderId) {
    filter.folderId = folderId;
  }

  if (tagId) {
    filter.tags = tagId;
  }

  Note.find(filter)
    .populate('tags')
    .sort({ updatedAt: 'desc' })
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
};

const noteDetailsGet = function (req, res, next) {
  const { id } = req.params;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findOne({ _id: id, userId })
    .populate('tags')
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

const noteCreatePost = function (req, res, next) {
  const { title, content, tags = [] } = req.body;
  const folderId = req.body.folderId ? req.body.folderId : undefined;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return next(err);
  }

  if (tags) {
    tags.forEach((tag) => {
      if (!mongoose.Types.ObjectId.isValid(tag)) {
        const err = new Error('The tags `id` is not valid');
        err.status = 400;
        return next(err);
      }
    });
  }

  const newNote = { title, content, folderId, tags, userId };

  Promise.all([
    validateFolderId(folderId, userId),
    validateTagIds(tags, userId)
  ])
    .then(() => {
      return Note.create(newNote);
    })
    .then(result => {
      res
        .location(`${req.originalUrl}/${result.id}`)
        .status(201)
        .json(result);
    })
    .catch(err => {
      next(err);
    });
};

const noteDetailsPut = function (req, res, next) {
  const { id } = req.params;
  const { title, content, tags = [], userId } = req.body;
  const folderId = req.body.folderId ? req.body.folderId : undefined;
  const currentUserId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(currentUserId)) {
    const err = new Error('The `userId` is not valid');
    err.status = 400;
    return next(err);
  }

  if (userId !== currentUserId) {
    const err = new Error('That note does not belong to you');
    err.status = 401;
    return next(err);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (title === '') {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return next(err);
  }

  if (tags) {
    const badIds = tags.filter((tag) => !mongoose.Types.ObjectId.isValid(tag));
    if (badIds.length) {
      const err = new Error('The tags `id` is not valid');
      err.status = 400;
      return next(err);
    }
  }

  const updateNote = { title, content, folderId, tags };

  Promise.all([
    validateFolderId(folderId, currentUserId),
    validateTagIds(tags, currentUserId)
  ])
    .then(() => {
      return Note.findOneAndUpdate(
        { _id: id, userId: currentUserId },
        updateNote,
        { new: true }
      );
    })
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

const noteDetailsDelete = function (req, res, next) {
  const { id } = req.params;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.deleteOne({ _id: id, userId })
    .then(() => {
      res.sendStatus(204);
    })
    .catch(err => {
      next(err);
    });
};

module.exports = { 
  notesListGet,
  noteDetailsGet,
  noteCreatePost,
  noteDetailsPut,
  noteDetailsDelete
};