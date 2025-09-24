console.log('Starting minimal server...');

import express from 'express';

console.log('Express imported successfully');

const app = express();

console.log('Express app created');

app.get('/', (req, res) => {
  console.log('GET / received');
  res.send('Hello World!');
});

console.log('Route defined');

const PORT = 5000;

console.log('About to start listening on port', PORT);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

console.log('Listen call completed');

