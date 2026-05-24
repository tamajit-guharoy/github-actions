const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Hello from GitHub Actions CI demo!' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy' });
});

// Only start the server if this file is run directly (not imported by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

module.exports = app;
