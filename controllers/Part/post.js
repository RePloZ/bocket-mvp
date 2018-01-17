const Part = require("../../models/Part");
const NodeSchema = require("../../models/Node");
const config = require('../../config/server');
const escape = require('escape-html');
const path = require('path');
const type_mime = require('../../utils/type-mime');
const NodeTypeEnum = require('../../enum/NodeTypeEnum');
const createFile = require('../utils/createFile');
const create3DFile = require('../utils/create3DFile');
const twig = require('twig');
const Assembly = require('../../models/Assembly');

/**
 * Create a new Part for the specified node
 */
const newPart = (req, res) => {

    let nodeId = escape(req.params.nodeId),
        name = escape(req.body.name),
        description = escape(req.body.description),
        tags = escape(req.body.tags),
        sub_level = Number(escape(req.body.sub_level)),
        breadcrumb = escape(req.body.breadcrumb),
        specFiles = req.files['specFiles'],
        files_3d = req.files['file3D'];

    sub_level++;

    NodeSchema.findById(nodeId)
        .then((parentNode) => {
            if (!parentNode)
                res.status(404).send("Not Found");
            else if (parentNode.type !== NodeTypeEnum.assembly)
                res.status(401).send("The node is a " + parentNode.type + ", it should not be an " + NodeTypeEnum.assembly);
            else {
                Assembly.findById(parentNode.content)
                    .then((parentAssembly) => {
                        let part = Part.newDocument({
                            name: name,
                            description: description,
                            tags: tags,
                            ownerOrganization: parentAssembly.ownerOrganization,
                        });
                        part.save()
                            .then((newPart) => {
                                let subNode = NodeSchema.newDocument({
                                    name: name,
                                    description: description,
                                    type: NodeTypeEnum.part,
                                    content: newPart._id,
                                    Workspaces: parentNode.Workspaces,
                                    tags: tags
                                });
                                createFiles(specFiles, files_3d, path.join(config.files3D, newPart.path));
                                subNode.save()
                                    .then((subNode) => {
                                        parentNode.children.push({
                                            _id: subNode._id,
                                            type: subNode.type,
                                            name: subNode.name,
                                        });
                                        parentNode.save()
                                            .then((newParentNode) => {
                                                newParentNode.children.forEach(child => {
                                                    child.breadcrumb = breadcrumb + '/' + child.name
                                                });
                                                twig.renderFile('./views/socket/three_child.twig', {
                                                    node: newParentNode,
                                                    TypeEnum: NodeTypeEnum,
                                                    sub_level: sub_level,
                                                    breadcrumb: breadcrumb
                                                }, (err, html) => {
                                                    if (err)
                                                        console.log(err);
                                                    res.send(html)
                                                });
                                            })
                                            .catch(err => {
                                                console.error(new Error("[Function newPart] Could'nt save the node Parent - " + err));
                                                newPart.remove();
                                                subNode.remove();
                                                throw err;
                                            })
                                    })
                                    .catch((err) => {
                                        console.error(new Error("[Function newPart] Could'nt save the subNode  - " + err));
                                        subNode.remove();
                                        throw err
                                    });
                            })
                            .catch(err => {
                                console.error(new Error("[Function newPart] Could'nt save the part \n" + err));
                                throw err;
                            });
                    })
                    .catch(err => {
                        console.error(new Error("[Function newPart] Could'nt save the part \n" + err));
                        throw err;
                    });
            }
        })
        .catch(() => {
            res.status(500).send("Internal Error");
        });
};

function createFiles(specFiles, files_3d, chemin) {
    let sendError = [];

    if (specFiles) {
        specFiles.forEach(spec => {
            type_mime(1, spec.mimetype)
                .then(() => {
                    return createFile(chemin, spec.originalname, spec.buffer);
                })
                .catch(err => {
                    console.log(err);
                    sendError.push("Could'nt create the file : " + spec.originalname)
                });
        });
    }

    if (files_3d) {
        files_3d.forEach(file => {
            type_mime(0, file.mimetype)
                .then(() => {
                    return create3DFile(chemin, file.originalname, file.buffer);
                })
                .catch((err) => {
                    console.log(err);
                    sendError.push("Could'nt create the file : " + file.originalname);
                });
        });
    }

    return (sendError)
}

var controllerPOST = {
    newPart: newPart
};

module.exports = controllerPOST;