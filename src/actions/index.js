const auth = require('./auth');
const health = require('./health');
const users = require('./users');
const { createNotification } = require('./notifications');

const handlers = {
  health: { auth: false, run: health.health },
  login: { auth: false, run: auth.login },
  checkSession: { auth: false, run: auth.checkSession },
  logout: { auth: false, run: auth.logout },
  me: { auth: true, run: auth.me },

  getUsers: { auth: true, run: users.getUsers },
  createUser: { auth: true, run: users.createUser },
  updateUser: { auth: true, run: users.updateUser },
  resetUserPassword: { auth: true, run: users.resetUserPassword },
  deleteUser: { auth: true, run: users.deleteUser },
  changePassword: { auth: true, run: users.changePassword },
  notifications_create: {
    auth: true,
    run: createNotification
  }
};

function getHandler(action) {
  return handlers[action] || null;
}

module.exports = { getHandler, handlers };
