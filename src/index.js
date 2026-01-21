const express = require('express');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// INTENTIONAL VULNERABILITY: Hardcoded secrets (Secret scanning WILL detect these patterns)
// AWS Access Key pattern (will trigger secret scanning)
const AWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7EXAMPLE';
const AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';

// GitHub Personal Access Token pattern (will trigger secret scanning)
const GITHUB_TOKEN = 'ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789';

// Slack Webhook URL pattern (will trigger secret scanning)
const SLACK_WEBHOOK = 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX';

// Generic JWT secret (for application use)
const JWT_SECRET = 'super-secret-key-12345-which-should-be-detected-by-secret-scanning';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// INTENTIONAL VULNERABILITY: SQL Injection pattern (SAST should flag this)
app.get('/users', (req, res) => {
  const userId = req.query.id;
  const query = `SELECT * FROM users WHERE id = '${userId}'`;
  console.log('Executing query:', query);
  res.json({ message: 'Query executed', query });
});

// INTENTIONAL VULNERABILITY: Command Injection (SAST should flag this)
app.get('/ping', (req, res) => {
  const host = req.query.host;
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
  const content = fs.readFileSync(`./data/${filename}`, 'utf8');
  res.send(content);
});

// INTENTIONAL VULNERABILITY: XSS (SAST should flag this)
app.get('/search', (req, res) => {
  const searchTerm = req.query.q;
  res.send(`<html><body>Search results for: ${searchTerm}</body></html>`);
});

// JWT endpoint with weak secret
app.post('/login', (req, res) => {
  const { username, password } = req.body;

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
  try {
    const result = eval(expression);
    res.json({ result });
  } catch (error) {
    res.status(400).json({ error: 'Invalid expression' });
  }
});

// ============================================================
// ADDITIONAL VULNERABILITIES FOR CODEQL DEMO
// ============================================================

// INTENTIONAL VULNERABILITY: NoSQL Injection (MongoDB-style)
app.get('/products', (req, res) => {
  const category = req.query.category;
  // Simulating MongoDB query with user input directly in query object
  const query = { $where: `this.category == '${category}'` };
  console.log('MongoDB query:', JSON.stringify(query));
  res.json({ message: 'Products query', query });
});

// INTENTIONAL VULNERABILITY: Open Redirect
app.get('/redirect', (req, res) => {
  const url = req.query.url;
  // Attacker can redirect users to malicious sites
  res.redirect(url);
});

// INTENTIONAL VULNERABILITY: Server-Side Request Forgery (SSRF)
app.get('/fetch', async (req, res) => {
  const targetUrl = req.query.url;
  const fetch = require('node-fetch');
  // Attacker can access internal services
  try {
    const response = await fetch(targetUrl);
    const data = await response.text();
    res.send(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// INTENTIONAL VULNERABILITY: Insecure Deserialization
app.post('/deserialize', (req, res) => {
  const serialized = req.body.data;
  // Using Function constructor is similar to eval
  try {
    const func = new Function('return ' + serialized);
    const result = func();
    res.json({ result });
  } catch (error) {
    res.status(400).json({ error: 'Deserialization failed' });
  }
});

// INTENTIONAL VULNERABILITY: Regular Expression DoS (ReDoS)
app.post('/validate-email', (req, res) => {
  const email = req.body.email;
  // This regex is vulnerable to catastrophic backtracking
  const emailRegex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  const isValid = emailRegex.test(email);
  res.json({ valid: isValid });
});

// INTENTIONAL VULNERABILITY: Log Injection
app.post('/log', (req, res) => {
  const userInput = req.body.message;
  // Attacker can inject fake log entries or CRLF characters
  console.log('User action: ' + userInput);
  res.json({ logged: true });
});

// INTENTIONAL VULNERABILITY: HTTP Header Injection
app.get('/set-header', (req, res) => {
  const headerValue = req.query.value;
  // Attacker can inject CRLF and add arbitrary headers
  res.setHeader('X-Custom-Header', headerValue);
  res.json({ message: 'Header set' });
});

// INTENTIONAL VULNERABILITY: Prototype Pollution via JSON.parse
app.post('/config', (req, res) => {
  const userConfig = req.body;
  const defaultConfig = { theme: 'light', lang: 'en' };
  // Merging user input into object without sanitization
  for (const key in userConfig) {
    defaultConfig[key] = userConfig[key];
  }
  res.json(defaultConfig);
});

// INTENTIONAL VULNERABILITY: Timing Attack on Password Comparison
app.post('/verify-password', (req, res) => {
  const { password } = req.body;
  const storedPassword = 'secretPassword123';
  // Direct string comparison leaks timing information
  if (password === storedPassword) {
    res.json({ valid: true });
  } else {
    res.json({ valid: false });
  }
});

// INTENTIONAL VULNERABILITY: XML External Entity (XXE) - if xml parser used
app.post('/parse-xml', (req, res) => {
  const xmlData = req.body.xml;
  // Simulating unsafe XML handling
  res.json({ message: 'XML received', length: xmlData?.length });
});

// INTENTIONAL VULNERABILITY: Hardcoded Database Credentials
const dbConfig = {
  host: 'localhost',
  user: 'admin',
  password: 'admin123!@#',  // Hardcoded credential
  database: 'production_db'
};

// INTENTIONAL VULNERABILITY: Insecure Random for Security Purpose
app.get('/generate-token', (req, res) => {
  const token = Math.random().toString(36).substring(2);
  res.json({ token });
});

// INTENTIONAL VULNERABILITY: Missing Rate Limiting (business logic)
// This endpoint has no rate limiting - vulnerable to brute force
app.post('/api-key-check', (req, res) => {
  const { apiKey } = req.body;
  const validKey = 'sk-12345-secret-api-key';
  if (apiKey === validKey) {
    res.json({ valid: true, access: 'granted' });
  } else {
    res.json({ valid: false });
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
