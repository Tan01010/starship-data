// app.js

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { Auth, authMiddleware } = require('./Auth.js');

const app = express();
const port = 3000;
const dbFile = 'database.json';

app.use(bodyParser.json());

// Initialize empty database if it doesn't exist
if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, JSON.stringify({ users: [] }, null, 2));
}

// Routes

// Login route (optional, since we're using headers for authentication)
app.post('/login', (req, res) => {
  const { name, sc } = req.body;
  if (!name || !sc) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  const auth = new Auth(name, sc);
  if (!auth.isAuthenticated()) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({ success: true });
});

// Apply authentication middleware to all routes below
app.use(authMiddleware);

// Read ALL data
app.get('/read/all', (req, res) => {
  try {
    const data = req.auth.getData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Read ONE key
app.get('/read/one/:key', (req, res) => {
  try {
    const data = req.auth.getData();
    const key = req.params.key;
    if (data[key] === undefined) {
      return res.status(404).json({ error: 'Key not found' });
    }
    res.json({ key, value: data[key] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create & Update
app.post('/api/data', (req, res) => {
  const { key, value } = req.body;
  if (!key || value === undefined) {
    return res.status(400).json({ error: 'key and value are required' });
  }

  try {
    req.auth.updateDataKey(key, value);
    res.json({ success: true, key, value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a key
app.delete('/api/data/:key', (req, res) => {
  const key = req.params.key;

  try {
    req.auth.deleteDataKey(key);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
