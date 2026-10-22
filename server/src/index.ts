import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`[SPIS Server] School Performance Intelligence API running on http://localhost:${PORT}`);
});
