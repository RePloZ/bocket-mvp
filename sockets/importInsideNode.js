let escape = require('escape-html');
let internalErrorEmitter = require("./emitter/internalErrorEmitter");
let serverConfig = require('../config/server');
let User = require("../models/User");
let Node = require("../models/Node");
let typeEnum = require("../enum/NodeTypeEnum.js");
let Part = require("../models/Part");
let Assembly = require("../models/Assembly");
let fs = require('fs');
let crypto = require('crypto');
const sign = crypto.createSign('SHA256');

let files = {};
let construct = {
    name: null,
    type: null,
    size: 0,
    data: [],
    slice: 0,
};

module.exports = (socket) => {
    socket.on("createFile", (nodeId, access) => {
        //Verify the user rights

        //Create a file
        fs.open(path.join(nodeId, access), 'a+', (err) => {
            if (err)
                socket.emit("ErrorToast");
        });
    });

    socket.on("writeStream", (nodeId, access, data) => {
        let writeStream = fs.createWriteStream(path.join(serverConfig.gitfiles, nodeId, access));
        writeStream.write(data, (err) => {
            socket.emit("ErrorToast");
        });
    });

    socket.on("importPart", (nodeId, partObj) => {
        //WARNING : VERIFY THE USER

        Node.findById(nodeId)
            .then((node) => {
                if(!node) {
                    console.log("Socket [importPart] : Couldn't found a node for the nodeID sent.");
                    socket.emit('ErrorToast', "The node " + part.name + "could'nt be send, please try again later")
                } else if (node.type !== typeEnum.assembly){
                    console.log("Socket [importPart] : The node is a assembly, it should be a part.");
                    socket.emit('ErrorToast', "The node " + part.name + "could'nt be send, please try again later")
                } else {
                    let part = Part.initialize(partObj.name, partObj.description, partObj.file3d, partObj.specFiles);
                    part.save()
                        .then((newPart) => {
                            node.type = typeEnum.part;
                            node.content =  newPart._id;
                            node.save()
                                .catch(err => {
                                    console.log(err);
                                    part.remove();
                                })
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                    socket.emit('ValidateToast', "The part " + partObj.name + " was created")
                }
            })
            .catch(err => {
                console.log(err);
                socket.emit('ErrorToast', "The part " + partObj.name + "could'nt be send, please try again later.")
            })
    });
    socket.on("importAssembly", (nodeId, assemblyObj) => {
        //WARNING : VERIFY THE USER

        Node.findById(nodeId)
            .then((node) => {
                if(!node) {
                    console.log("Socket [importPart] : Couldn't found a node for the nodeID sent.");
                    socket.emit('ErrorToast', "The node " + part.name + "could'nt be send, please try again later")
                } else if (node.type !== typeEnum.part){
                    console.log("Socket [importPart] : The node is a assembly, it should be a part.");
                    socket.emit('ErrorToast', "The node " + part.name + "could'nt be send, please try again later")
                } else {
                    let assembly = Part.initialize(assemblyObj.name, assemblyObj.description, assemblyObj.file3d, assemblyObj.specFiles);
                    assembly.save()
                        .then((newPart) => {
                            node.type = typeEnum.assembly;
                            node.content =  newPart._id;
                            node.save()
                                .catch(err => {
                                    console.log(err);
                                    assembly.remove();
                                })
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                    socket.emit('ValidateToast', "The part " + assemblyObj.name + " was created")
                }
            })
            .catch(err => {
                console.log(err);
                socket.emit('ErrorToast', "The part " + assemblyObj.name + "could'nt be send, please try again later.")
            })

    });
    socket.on("createSpecfiles", (nodeId) => {

    });
    socket.on("create3Dfiles", (nodeId) => {

    });
};
