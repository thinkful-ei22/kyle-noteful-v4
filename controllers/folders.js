'use strict';

const mongoose = require('mongoose');
const Folder = require('../models/folder');
const Note = require('../models/note');

// HELPERS
const validateNamePresence = function (item, callback) {
  if (!item.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return callback(err);
  }
  return item;
};
const validateDatabaseId = function (id, callback) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return callback(err);
  }
  return id;
};
const duplicateErrorHandler = function (err) {
  if (err.code === 11000) {
    err = new Error('Folder name already exists');
    err.status = 400;
  }
  return err;
};
const successResultHandler = function (result, res, next) {
  if (result) {
    return res.json(result);
  } else {
    return next();
  }
};

// CONTROLLERS
const folderCreatePost = function (req, res, next) {
  const { name } = req.body;
  const userId = req.user.id;

  const newFolder = { name, userId };
  const validFolder = validateNamePresence(newFolder, next);

  Folder.create(validFolder)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      err = duplicateErrorHandler(err);
      next(err);
    });
};
const foldersListGet = function (req, res, next) {
  const userId = req.user.id;
  
  const filter = { userId };

  Folder.find(filter)
    .collation({ locale: 'en' })
    .sort('name')
    .then(results => {
      successResultHandler(results, res, next);
    })
    .catch(err => {
      next(err);
    });
};
const folderDetailsGet = function (req, res, next) {
  const { id } = req.params;
  const userId = req.user.id;

  const validId = validateDatabaseId(id, next);

  let filter = { _id: validId, userId };

  Folder.findOne(filter)
    .then(result => {
      successResultHandler(result, res, next);
    })
    .catch(err => {
      next(err);
    });
};
const folderDetailsPut = function (req, res, next) {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user.id;
  const updateFolder = { name };

  const validId = validateDatabaseId(id, next);
  const validFolder = validateNamePresence(updateFolder, next);
  const filter = { _id: validId, userId };

  Folder.findOneAndUpdate(filter, validFolder, { new: true })
    .then(result => {
      successResultHandler(result, res, next);
    })
    .catch(err => {
      err = duplicateErrorHandler(err);
      next(err);
    });
};
const folderDetailsDelete = function (req, res, next) {
  const { id } = req.params;
  const userId = req.user.id;

  const validId = validateDatabaseId(id, next);

  const folderFilter = { _id: validId, userId };
  const folderRemovePromise = Folder.deleteOne(folderFilter);
  const noteRemovePromise = Note.updateMany(
    { folderId: id, userId },
    { $unset: { folderId: '' } }
  );

  Promise.all([folderRemovePromise, noteRemovePromise])
    .then(() => {
      res.sendStatus(204);
    })
    .catch(err => {
      next(err);
    });
};

module.exports = { 
  foldersListGet,
  folderDetailsGet,
  folderDetailsPut,
  folderDetailsDelete,
  folderCreatePost
};