const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

// Middleware to parse JSON body of POST requests
app.use(express.json());  // Replaced body-parser with express.json()

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
    res.json(rows);
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

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
