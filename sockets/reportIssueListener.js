const mailTransporter = require('../utils/mailTransporter');
const mailConfig = require('../config/welcomeEmail');
const actionFailed = require('./emitter/actionFailed');
const actionSucceeded = require('./emitter/actionSucceeded')

const listenerName = 'reportIssue';

module.exports = (socket) => {
  socket.on(listenerName, ({ title, description }) => {
    const mailOptions = {
      from: mailConfig.email,
      to: mailConfig.email,
      subject: 'ISSUE BOCKET.ME',
      html: `Issue créée par ${socket.handshake.userMail}<br>TITLE: ${title}<br><br>DESCRIPTION: ${description}`,
    };
    mailTransporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('[ReportIssue] error:', info);
        actionFailed(socket, { title: 'Report Issue', description: 'An error occured, please try again' });
      } else {
        console.log('[ReportIssue] success:', info);
        actionSucceeded(socket, { title: 'Report Issue', description: 'The issue has been reported' });
      }
    });
  });
};