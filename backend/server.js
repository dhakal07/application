const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// Middleware to parse JSON body of POST requests
app.use(bodyParser.json());

// Connect to SQLite database
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Failed to connect to the database', err);
  } else {
    console.log('Connected to SQLite database');

    // Create the users table if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL
      )
    `);
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the server! Visit /users to interact with the database.');
});

// GET route to retrieve all users
app.get('/users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);  // Return users as a JSON array
  });
});

// POST route to create a new user
app.post('/users', (req, res) => {
  const { name, email } = req.body;  // Expect name and email from the request body

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  // Insert new user into the database
  const query = 'INSERT INTO users (name, email) VALUES (?, ?)';
  db.run(query, [name, email], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Respond with the newly created user
    res.status(201).json({
      id: this.lastID,
      name,
      email,
    });
  });
});

// DELETE route to delete a user by ID
app.delete('/users/:id', (req, res) => {
  const { id } = req.params;  // Get the user ID from the URL parameter

  const query = 'DELETE FROM users WHERE id = ?';
  db.run(query, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Check if a row was deleted
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: `User with ID ${id} deleted successfully` });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
