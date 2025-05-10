const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Auth = require('./Auth');
const app = express();
const PORT = 3000;


const auth = new Auth('./database.json');

app.use(cors());
app.use(bodyParser.json());

// LOGIN (returns token)
app.post('/api/login', (req, res) => {
  const { username, sc } = req.body;
  
  // Authenticate user by username and secret code
  const result = auth.authenticate(username, sc);
  if (result) {
    res.status(200).json({ message: 'Authenticated', token: result.token, data: result.user.data });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// MIDDLEWARE: Auth (Check token or username and secret code)
function requireAuth(req, res, next) {
  let username;

  // 1. Check if token is provided in headers
  const token = req.headers.authorization;
  if (token) {
    username = auth.validateToken(token);
  }
  
  // 2. Otherwise, check username and secret code in body
  if (!username) {
    const { username: bodyUsername, sc } = req.body;
    username = auth.authenticate(bodyUsername, sc) ? bodyUsername : null;
  }

  if (!username) return res.status(401).json({ message: 'Unauthorized' });

  req.username = username;
  next();
}

// READ ALL DATA
app.get('/api/data', requireAuth, (req, res) => {
  const data = auth.getUserData(req.username);
  res.json(data);
});

// READ ONE ITEM
app.get('/api/data/:key', requireAuth, (req, res) => {
  const data = auth.getUserData(req.username);
  const item = data[req.params.key];
  if (item !== undefined) {
    res.json({ [req.params.key]: item });
  } else {
    res.status(404).json({ message: 'Key not found' });
  }
});

// CREATE NEW ITEM
app.post('/api/data/item', requireAuth, (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ message: 'Key is required' });

  const data = auth.getUserData(req.username);
  if (data[key] !== undefined) return res.status(400).json({ message: 'Key already exists' });

  data[key] = value;
  auth.updateUserData(req.username, data);
  res.json({ message: 'Item created', [key]: value });
});

// UPDATE ITEM
app.put('/api/data/:key', requireAuth, (req, res) => {
  const key = req.params.key;
  const newValue = req.body.value;

  const data = auth.getUserData(req.username);
  if (data[key] === undefined) return res.status(404).json({ message: 'Key not found' });

  data[key] = newValue;
  auth.updateUserData(req.username, data);
  res.json({ message: 'Item updated', [key]: newValue });
});

// DELETE ITEM
app.delete('/api/data/:key', requireAuth, (req, res) => {
  const key = req.params.key;

  const data = auth.getUserData(req.username);
  if (data[key] === undefined) return res.status(404).json({ message: 'Key not found' });

  delete data[key];
  auth.updateUserData(req.username, data);
  res.json({ message: 'Item deleted', deletedKey: key });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
