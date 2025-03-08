const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors'); // Importing the CORS module
const app = express();
const port = 3000;

// Middleware to parse JSON body of POST requests
app.use(bodyParser.json());

// Use CORS middleware
app.use(cors()); // Enable CORS for all routes

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Connect to SQLite database
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Failed to connect to the database', err);
  } else {
    console.log('Connected to SQLite database');
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        contact TEXT NOT NULL,
        age INTEGER NOT NULL
      )
    `);
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the server! Visit /users to interact with the database.');
});

// Helper function to get all users
function getAllUsers(res) {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
}

// GET route to retrieve all users
app.get('/users', (req, res) => {
  getAllUsers(res);
});

// POST route to create a new user
app.post('/users', (req, res) => {
  const { username, contact, age } = req.body;
  if (!username || !contact || !age) {
    return res.status(400).json({ error: 'Username, contact, and age are required' });
  }
  
  const query = 'INSERT INTO users (username, contact, age) VALUES (?, ?, ?)';
  db.run(query, [username, contact, age], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // Send back the newly added user
    console.log(`User added: ID: ${this.lastID}, Username: ${username}, Contact: ${contact}, Age: ${age}`);
    res.status(201).json({ id: this.lastID, username, contact, age });
  });
});

// PUT route to update a user by ID
app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { username, contact, age } = req.body;

  if (!username || !contact || !age) {
    return res.status(400).json({ error: 'Username, contact, and age are required' });
  }

  const query = 'UPDATE users SET username = ?, contact = ?, age = ? WHERE id = ?';
  db.run(query, [username, contact, age, id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: `User with ID ${id} not found` });
    }
    // Return updated user
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json(user);
    });
  });
});

// DELETE route to remove a user by ID
app.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM users WHERE id = ?';
  db.run(query, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    // After deletion, return the updated list of users
    console.log(`User with ID ${id} deleted.`);
    getAllUsers(res);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Gracefully close database connection when server shuts down
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing the database:', err);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});
