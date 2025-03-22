const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors({ origin: 'http://localhost:3001' })); // Adjust according to frontend URL
app.use(express.static(path.join(__dirname, 'public')));

// Connect to SQLite database
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('❌ Failed to connect to the database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        contact TEXT NOT NULL,
        age INTEGER NOT NULL
      )`,
      (err) => {
        if (err) console.error('⚠️ Error creating table:', err.message);
        else console.log('✅ Users table ensured');
      }
    );
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the server! Visit /users to interact with the database.');
});

// GET all users
app.get('/users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST: Create a new user
app.post('/users', (req, res) => {
  const { username, contact, age } = req.body;
  if (!username || !contact || !age) {
    return res.status(400).json({ error: 'All fields (username, contact, age) are required' });
  }

  db.run('INSERT INTO users (username, contact, age) VALUES (?, ?, ?)', [username, contact, age], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    console.log(`✅ User added: ID ${this.lastID} | Username: ${username}`);
    res.status(201).json({ id: this.lastID, username, contact, age });
  });
});

// PUT: Update a user by ID
app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { username, contact, age } = req.body;

  if (!username || !contact || !age) {
    return res.status(400).json({ error: 'All fields (username, contact, age) are required' });
  }

  db.run('UPDATE users SET username = ?, contact = ?, age = ? WHERE id = ?', [username, contact, age, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ message: `User with ID ${id} not found` });

    db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json(user);
    });
  });
});

// DELETE: Remove a user by ID
app.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ message: 'User not found' });

    console.log(`🗑️ User with ID ${id} deleted.`);
    res.status(200).json({ message: `User with ID ${id} deleted.` });
  });
});

// Start server
app.listen(port, () => console.log(`🚀 Server running at http://localhost:${port}`));

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) console.error('❌ Error closing database:', err.message);
    else console.log('✅ Database connection closed.');
    process.exit(0);
  });
});
