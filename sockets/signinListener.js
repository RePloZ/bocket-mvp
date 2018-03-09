// let escape = require('escape-html');
const internalErrorEmitter = require('./emitter/internalErrorEmitter');
const User = require('../models/User');
const Workspaces = require('../models/Workspace');
const Organization = require('../models/Organization');
const acceptInvitation = require('../utils/Invitations/acceptInvitation');

module.exports = function (socket) {
  socket.on('signin', (accountInformation) => { // accountInformation.email & accountInformation.password && invitationUid (optional)
    console.log('AccountInformation = ', accountInformation);

    /* accountInformation.email = escape(accountInformation.email);
        accountInformation.password = escape(accountInformation.password); */

    User.findOne({ email: `${accountInformation.email}` })
      .then((user) => {
        // console.log("Signin listner : ", user);
        if (user !== null) {
          user.comparePassword(accountInformation.password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {
              findAllWorkspaces(user.workspaces)
                .then((workspaces) => {
                  findOwnerOrganization(user.id)
                    .then((organization) => {
                      if (!accountInformation.invitationUid) { socket.emit('signinSucced', { workspaces, user, organization }); } else { emitWithInvitation(accountInformation, user, socket); }
                    })
                    .catch((err) => {
                      socket.emit('signinFailed');
                    });
                })
                .catch((err) => {
                  socket.emit('signinFailed');
                });
            } else {
              socket.emit('signinFailed');
            }
          });
        } else {
          socket.emit('signinFailed');
        }
      })
      .catch((err) => {
        internalErrorEmitter(socket);
      });
  });
};

function findAllWorkspaces(nestedWorkspaces) {
  const workspaces = [];

  return new Promise((resolve, reject) => {
    let i = 0;
    if (nestedWorkspaces.length === 0) { resolve(workspaces); }
    nestedWorkspaces.forEach((workspace) => {
      Workspaces.findOne({ _id: workspace._id })
        .then((w) => {
          workspaces.push(w);
          i += 1;
          if (i === nestedWorkspaces.length) {
            // console.log("findAllWorkspaces : ", workspaces);
            resolve(workspaces);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  });
}

function emitWithInvitation(accountInformation, user, socket) {
  acceptInvitation(accountInformation.invitationUid, user)
    .then(res => socket.emit('signinSucced', res.workspaceId))
    .catch((err) => {
      console.log(err);
      internalErrorEmitter(socket);
    });
}

function findOwnerOrganization(userId) {
  return new Promise((resolve, reject) => {
    Organization.find({ 'owner._id': userId })
      .then((orga) => {
        if (!orga) { resolve(null); }
        resolve(orga);
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
}
