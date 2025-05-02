const fs = require('fs');
const crypto = require('crypto');

class Auth {
  constructor(databasePath) {
    this.dbPath = databasePath;
    this.users = JSON.parse(fs.readFileSync(this.dbPath, 'utf-8')).users;
    this.sessions = {}; // token -> username
  }

  authenticate(username, secretCode) {
    const user = this.users.find(u => u.name === username && u.sc === secretCode);
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      this.sessions[token] = username;
      return { token, user };
    }
    return null;
  }

  validateToken(token) {
    return this.sessions[token] || null;
  }

  getUserData(username) {
    const user = this.users.find(user => user.name === username);
    return user ? user.data : null;
  }

  updateUserData(username, newData) {
    const userIndex = this.users.findIndex(user => user.name === username);
    if (userIndex !== -1) {
      this.users[userIndex].data = newData;
      fs.writeFileSync(this.dbPath, JSON.stringify({ users: this.users }, null, 2));
      return true;
    }
    return false;
  }
}

module.exports = Auth;
