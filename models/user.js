'use strict';

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullname: String,
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

userSchema.methods.validatePassword = function(password) {
  return password === this.password;
};

userSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.password;
  }
});

module.exports = mongoose.model('User', userSchema);