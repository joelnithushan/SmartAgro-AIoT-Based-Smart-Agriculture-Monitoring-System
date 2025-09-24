import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Simple server is working' });
});

app.post('/api/chat/test', (req, res) => {
  res.json({ 
    success: true, 
    reply: 'Test response from simple server',
    source: 'simple-server'
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Simple server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

