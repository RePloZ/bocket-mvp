const escape = require('escape-html');
const ModelsMaker = require("../models/utils/create/ModelsMaker");
const nodeMasterConfig = require("../config/nodeMaster");
const NodeSchema = require("../models/Node");
const Invitation = require("../models/Invitation");
const Workspace = require("../models/Workspace");
const AssemblySchema = require("../models/Assembly");
const NodeTypeEnum = require("../enum/NodeTypeEnum");
const OrganizationSchema = require("../models/Organization");
const UserSchema = require("../models/User");
const WorkspaceSchema = require("../models/Workspace");
const acceptInvitation = require("../utils/Invitations/acceptInvitation");
const signInUserSession = require("../utils/signInUserSession");
const Team = require("../models/Team");

let signUpController = {

    // TODO: FAILLE XSS

    index: function (req, res) {
        let tasks = [
            checkEmail,
            checkPassword,
            checkCompleteName,
            checkOrganizationName,
            checkWorkspaceName,
        ];
        for (let i = 0; i < tasks.length; i++) {
            if (tasks[i](req.body) === false) {
                console.log("Error occured on signing up user on task[" + i + "]");
                return res.redirect("/");
            }
        }
        let Documents = {}

        let user = UserSchema.newDocument({
            completeName: req.body.completeName,
            password : req.body.password,
            email : req.body.email,
            workspaces: [],
            organizations: []
        });

        user.save()
            .then((newUser) => {
                console.log(Documents.user);
                Documents.user = newUser;
                let organization = OrganizationSchema.newDocument({
                    owner: {
                        _id: Documents.user._id,
                        completeName: Documents.user.completeName,
                        email: Documents.user.email
                    },
                    members: [{
                        _id: Documents.user._id,
                        completeName: Documents.user.completeName,
                        email: Documents.user.email
                    }],
                    name: req.body.organizationName
                })
                return organization.save();
            })
            .then(newOrga => {
                console.log("new Organization is created", newOrga);
                Documents.organization = newOrga;
                let team = Team.newDocument({
                    owners: [{
                        _id: Documents.user._id,
                        completeName: Documents.user.completeName,
                        email: Documents.user.email,
                    }],
                    email: Documents.user.email,
                })
                return team.save();
            })
            .then(newTeam => {
                console.log("\n\nnew team has been add", newTeam);
                Documents.team = newTeam
                let workspace = WorkspaceSchema.newDocument({
                    name : req.body.workspaceName,
                    owner: {
                        _id:            Documents.user._id,
                        completeName:   Documents.user.completeName,
                        email:          Documents.user.email
                    },
                    organization: {
                        _id:    Documents.organization._id,
                        name:   Documents.organization.name,
                    },
                    team: {
                        _id:        Documents.team._id,
                        owners:     Documents.team.owners,
                        members:    Documents.team.members,
                        consults:   Documents.team.consults
                    }
                });


                if (req.body.invitationUid) {
                    console.log("INVITATION");
                    acceptInvitation(req.body.invitationUid, newUser)
                        .then(invitationInfo => {
                            req.session = signInUserSession(req.session, {email: user.email});
                            req.session.completeName = newUser.completeName;
                            req.session.currentWorkspace = invitationInfo.workspaceId;
                            res.redirect("/project/" + invitationInfo.workspaceId);
                        })
                        .catch(err => {
                            console.log(err);
                            newOrga.remove();
                            newUser.remove();
                        })
                    Promise.reject("Invitation");
                } else
                    return workspace.save()
            })
            .then(newWorkspace => {
                console.log("\n\nnew workspace has been add \n", Documents.workspace);
                Documents.workspace = newWorkspace;
                Documents.user.workspaces.push({ _id: Documents.workspace._id, name: Documents.workspace.name });
                return Documents.user.save();
            })
            .then(() => {
                let assembly = AssemblySchema.newDocument({
                    name: nodeMasterConfig.name,
                    description: nodeMasterConfig.description,
                    ownerOrganization: {
                        _id:    Documents.organization._id,
                        name:   Documents.organization.name
                    },
                });
                return assembly.save();
            })
            .then(newAssembly => {
                console.log("\n\nnew assembly has been add \n", Documents.assembly);
                Documents.assembly = newAssembly;
                let node = NodeSchema.newDocument({
                    name:           nodeMasterConfig.name,
                    description:    nodeMasterConfig.description,
                    type:           NodeTypeEnum.assembly,
                    content:        Documents.assembly._id,
                    Users: [{
                        _id:            Documents.user._id,
                        completeName:   Documents.user.completeName,
                        email:          Documents.user.email
                    }],
                    owners: [{
                        _id:    Documents.user._id,
                        completeName:   Documents.user.completeName,
                        email:  Documents.user.email
                    }],
                    team: {
                        _id:        Documents.team._id,
                        owners:     Documents.team.owners,
                        members:    Documents.team.members,
                        consults:   Documents.team.consults
                    },
                    Workspaces: [Documents.workspace._id]
                });
                return node.save();
            })
            .then(nodeMaster => {
                console.log("\n\nnew node has been add \n", Documents.node);
                Documents.node = nodeMaster;
                Documents.workspace.node_master = nodeMaster;
                return Documents.workspace.save()
            })
            .then(() => {
                console.log("")
                Documents.user.workspaces.push({
                    _id: Documents.workspace._id,
                    name: Documents.workspace.name});
                return Documents.user.save();
            })
            .then(() => {
                Documents.organization.workspaces.push({
                    _id: Documents.workspace._id,
                    name: Documents.workspace.name});
                return Documents.organization.save();
            })
            .then(() => {
                Documents.assembly.whereUsed.push(Documents.node._id);
                return Documents.assembly.save();
            })
            .then(()=> {
            req.session = signInUserSession(req.session, {email: Documents.user.email});
            req.session.completeName = Documents.user.completeName;
            req.session.currentWorkspace = Documents.workspace._id;
            res.redirect("/project/" + Documents.workspace._id);
        })
    .catch(err => {
            if (err === "Invitation") return ;
            console.error(new Error("[Sign up Controller] -  erreur \n" + err));
            Object.values(Documents).forEach(Documents => {
                if (Documents)
                    Documents.remove();
            });
        });
    },
};

let passwordInfo = {
    minlength: 6
};

let emailInfo = {
    minlength: 4
};

let organizationNameInfo = {
    minlength: 1
};

let completeNameInfo = {
    minlength: 3
};

let workspaceNameInfo = {
    minlength: 1
};

function checkOrganizationName(body) {
    body.organizationName = escape(body.organizationName);
    return basicCheck(body.organizationName, organizationNameInfo);
}

function checkCompleteName(body) {
    let regex = /[A-Z][a-z]+ [A-Z][a-z]+/;
    let completeName = body.completeName;
    body.completeName = escape(body.completeName);
    return basicCheck(completeName, completeNameInfo) && regex.test(completeName);
}

function checkWorkspaceName(body) {
    body.workspaceName = escape(body.workspaceName);
    return basicCheck(body.workspaceName, workspaceNameInfo);
}

function checkPassword(body) {
    body.password = escape(body.password);
    return basicCheck(body.password, passwordInfo);
}

function checkEmail(body) {
    console.log("Email:", body.email);
    body.email = escape(body.email);
    return basicCheck(body.email, emailInfo);
}

function basicCheck(parameter, parameterInfo) {
    return parameter !== undefined && parameter !== "" && parameter.length >= parameterInfo.minlength;
}

module.exports = signUpController;