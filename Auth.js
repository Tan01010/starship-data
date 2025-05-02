// Auth.js

const fs = require('fs');

const dbFile = 'database.json';

// Helper to load the database
function loadDB() {
  const data = fs.readFileSync(dbFile);
  return JSON.parse(data);
}

// Helper to save the database
function saveDB(db) {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
}

class Auth {
  constructor(name, sc) {
    this.name = name;
    this.sc = sc;
    this.user = null;
    this.authenticate();
  }

  authenticate() {
    const db = loadDB();
    const foundUser = db.users.find(user => user.name === this.name && user.sc === this.sc);
    if (foundUser) {
      this.user = foundUser;
    }
  }

  isAuthenticated() {
    return this.user !== null;
  }

  getData() {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    return this.user.data;
  }

  setData(newData) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    const db = loadDB();
    const userIndex = db.users.findIndex(user => user.name === this.name && user.sc === this.sc);
    if (userIndex !== -1) {
      db.users[userIndex].data = newData;
      saveDB(db);
      this.user.data = newData;
    }
  }

  updateDataKey(key, value) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    const db = loadDB();
    const userIndex = db.users.findIndex(user => user.name === this.name && user.sc === this.sc);
    if (userIndex !== -1) {
      db.users[userIndex].data[key] = value;
      saveDB(db);
      this.user.data[key] = value;
    }
  }

  deleteDataKey(key) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    const db = loadDB();
    const userIndex = db.users.findIndex(user => user.name === this.name && user.sc === this.sc);
    if (userIndex !== -1 && db.users[userIndex].data.hasOwnProperty(key)) {
      delete db.users[userIndex].data[key];
      saveDB(db);
      delete this.user.data[key];
    }
  }
}

// Middleware to authenticate user and attach to request
function authMiddleware(req, res, next) {
  const { name, sc } = req.headers;
  if (!name || !sc) {
    return res.status(401).json({ error: 'Missing credentials in headers' });
  }

  const auth = new Auth(name, sc);
  if (!auth.isAuthenticated()) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.auth = auth;
  next();
}

module.exports = { Auth, authMiddleware };
