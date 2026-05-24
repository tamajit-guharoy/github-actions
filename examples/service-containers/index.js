const express = require('express');
const db = require('./db');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello from service containers!' });
});

app.post('/messages', async (req, res) => {
  try {
    const msg = await db.addMessage(req.body.content);
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/messages', async (req, res) => {
  try {
    const messages = await db.getMessages();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;

if (require.main === module) {
  db.initDb().then(() => {
    app.listen(port, () => console.log(`Listening on port ${port}`));
  });
}

module.exports = app;
