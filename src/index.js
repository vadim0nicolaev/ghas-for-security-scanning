const express = require('express');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// INTENTIONAL VULNERABILITY: Hardcoded secret (Secret scanning should catch this pattern)
const JWT_SECRET = 'super-secret-key-12345';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// INTENTIONAL VULNERABILITY: SQL Injection pattern (SAST should flag this)
app.get('/users', (req, res) => {
  const userId = req.query.id;
  // Simulated SQL query - DO NOT USE IN PRODUCTION
  const query = `SELECT * FROM users WHERE id = '${userId}'`;
  console.log('Executing query:', query);
  res.json({ message: 'Query executed', query });
});

// INTENTIONAL VULNERABILITY: Command Injection (SAST should flag this)
app.get('/ping', (req, res) => {
  const host = req.query.host;
  // DO NOT USE IN PRODUCTION - Command injection vulnerability
  exec(`ping -c 1 ${host}`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: stderr });
    }
    res.json({ output: stdout });
  });
});

// INTENTIONAL VULNERABILITY: Path traversal (SAST should flag this)
app.get('/file', (req, res) => {
  const filename = req.query.name;
  const fs = require('fs');
  // DO NOT USE IN PRODUCTION - Path traversal vulnerability
  const content = fs.readFileSync(`./data/${filename}`, 'utf8');
  res.send(content);
});

// INTENTIONAL VULNERABILITY: XSS (SAST should flag this)
app.get('/search', (req, res) => {
  const searchTerm = req.query.q;
  // DO NOT USE IN PRODUCTION - XSS vulnerability
  res.send(`<html><body>Search results for: ${searchTerm}</body></html>`);
});

// JWT endpoint with weak secret
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Simplified auth (DO NOT USE IN PRODUCTION)
  if (username && password) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Using lodash (vulnerable version)
app.post('/merge', (req, res) => {
  const { obj1, obj2 } = req.body;
  // Using _.merge which has prototype pollution in older versions
  const result = _.merge({}, obj1, obj2);
  res.json(result);
});

// INTENTIONAL VULNERABILITY: Eval usage (SAST should flag this)
app.post('/calculate', (req, res) => {
  const { expression } = req.body;
  // DO NOT USE IN PRODUCTION - Eval vulnerability
  try {
    const result = eval(expression);
    res.json({ result });
  } catch (error) {
    res.status(400).json({ error: 'Invalid expression' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
