const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const centerRoutes = require('./routes/center.routes');
const pickupRoutes = require('./routes/pickup.routes');

const app = express();

// CORS configuration - allow all origins for development, INCLUDING PATCH
app.use(
  cors({
    origin: '*',
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Simple request logger for debugging (prints method and URL)
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.originalUrl);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/centers', centerRoutes);
app.use('/api/pickups', pickupRoutes);

app.get('/', (req, res) =>
  res.json({ ok: true, msg: 'Smart E-waste Backend' })
);

module.exports = app;
