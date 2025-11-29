// Mock server for testing - run with: node mockServer.js
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/hospital/register', (req, res) => {
  console.log('Hospital registration:', req.body);
  res.json({ message: 'Hospital registered successfully', id: Date.now() });
});

app.listen(8000, () => {
  console.log('Mock server running on http://127.0.0.1:8000');
});