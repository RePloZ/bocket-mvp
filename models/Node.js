let serverConfiguration = require("../config/server");
let mongoose = require("mongoose");
let NestedNode = require("./nestedSchema/NestedNodeSchema");
let uniqueValidator = require('mongoose-unique-validator');
let createNode = require("./utils/create/createNode");
let NestedUser = require("./nestedSchema/NestedUserSchema");
let NodeTypeEnum = require("../enum/NodeTypeEnum");
let NestedSpecFiles = require('./nestedSchema/NestedSpecFile');
let TypeEnum = require('../enum/NodeTypeEnum');


let NestedWorkspace = mongoose.Schema({
    _id: {type: mongoose.SchemaTypes.ObjectId, require: true},
    name: {type: String, require: true}
});

let NodeSchema = mongoose.Schema({
    name: {type:String, default: 'My Bocket'},
    description: String,
    content: {type: mongoose.SchemaTypes.ObjectId, require: false},
    type: { type:String, default:'empty'},
    specpath: {type: [String], default: []},
    tags: {type: [String], default: []},
    children: {type: [NestedNode], default: []},
    created: {type: Date, default:  Date.now()},
    modified: {type: Date, default: Date.now()},
    Users: {type: [NestedUser], default: []},
    Workspace: [String],
    owners: {type: [NestedUser], default: []},
    maturity: {type: String, default: [NodeTypeEnum.maturity[0]]}
    //matrice de donnée ???
});

NodeSchema.plugin(uniqueValidator);

NodeSchema.statics.initializeNode = (name, description, workspaces, user) => {
    return new Node({
        name: name,
        description: description,
        Workspace: workspaces,
        Users: user,
        type: TypeEnum.assembly
    })
};

NodeSchema.statics.createNode = (name, description, type, specpath) => {
    return new Node({
        name: name,
        description: description,
        type: type,
        specpath: specpath,
    });
};
NodeSchema.statics.createNodeWithContent = (name, description, type, content, specpath, tags) => {
    return new Node({
        name: name,
        description: description,
        type: type,
        specpath: specpath,
        tags: tags,
        content: content,
    });
};

let Node = mongoose.model("Node", NodeSchema, "Nodes");

module.exports = Node;