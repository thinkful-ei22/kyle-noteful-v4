'use strict';

const mongoose = require('mongoose');
const Folder = require('../models/folder');
const Note = require('../models/note');

const folderCreatePost = function (req, res, next) {
  const { name } = req.body;
  const userId = req.user.id;

  const newFolder = { name, userId };

  /***** Never trust users - validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  Folder.create(newFolder)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Folder name already exists');
        err.status = 400;
      }
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
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
};
const folderDetailsGet = function (req, res, next) {
  const { id } = req.params;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  let filter = { _id: id, userId };

  Folder.findOne(filter)
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
const folderDetailsPut = function (req, res, next) {
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
  const updateFolder = { name };

  Folder.findOneAndUpdate(filter, updateFolder, { new: true })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Folder name already exists');
        err.status = 400;
      }
      next(err);
    });
};
const folderDetailsDelete = function (req, res, next) {
  const { id } = req.params;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  const folderFilter = { _id: id, userId };
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