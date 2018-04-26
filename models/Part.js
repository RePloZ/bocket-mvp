const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const util = require('util');
const uniqueValidator = require('mongoose-unique-validator');

const configServer = require('../config/server');
const TypeEnum = require('../enum/NodeTypeEnum');
const NestedAnnotation = require('./nestedSchema/NestedAnnotation');
const NestedComment = require('./nestedSchema/NestedActivitySchema');
const NestedAssembly = require('./nestedSchema/NestedAssemblySchema');
const NestedUser = require('./nestedSchema/NestedUserSchema');
const PartFileSystem = require('../config/PartFileSystem');
const asyncForEach = require('./utils/asyncForeach');

const log = require('../utils/log');

const logPart = log.child({ type: 'part' });

const NestedOrganization = mongoose.Schema({
  _id: { type: mongoose.SchemaTypes.ObjectId, require: true },
  name: { type: String, require: true },
});

const PartSchema = mongoose.Schema({
  name: { type: String, require: true },
  description: { type: String, default: 'No description aviable' },

  path: String,
  pathVersion: { type: Number, default: 1 },
  maturity: { type: String, default: TypeEnum.maturity[0] },
  ownerOrganization: { type: NestedOrganization, require: true },
  quality: { type: Number, default: 0 },
  tags: { type: [], default: [] },
  creator: { type: NestedUser, require: true },
  annotation: { type: [NestedAnnotation], default: [] },
  activities: { type: [NestedComment], default: [] },

  optionViewer: {
    activateCellShading: { type: Boolean, default: false },
  }

  // owners: {type: [nestedOwners], default: []}
});
PartSchema.index({ name: 'text', description: 'text' });

PartSchema.on('indexError', (error) => {
  logPart.error(error);
});

function mkdirPromise(path) {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, (err) => {
      if (err) { reject(err); } else resolve();
    });
  });
}

PartSchema.pre('validate', function (next) {

  if (this.path) { return next(); }

  this.path = `/${this.ownerOrganization.name}-${this.ownerOrganization._id}/${this.name} - ${this._id}`;
  //this.pathVersion = 2
  const partPath = path.join(configServer.files3D, this.path);

  mkdirPromise(partPath)
    .then(() => {
      const promises = [];
      for (const directory in PartFileSystem) {
        promises.push(mkdirPromise(path.join(partPath, PartFileSystem[directory])));
      }
      return Promise.all(promises);
    })
    .then(() => next())
    .catch(err => next(err));
});
PartSchema.statics.newDocument = partInformation => new Part(partInformation);

PartSchema.plugin(uniqueValidator);

let Part = mongoose.model('Part', PartSchema, 'Parts');

module.exports = Part;
