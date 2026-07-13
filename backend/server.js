const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const requestRoutes = require('./routes/requestRoutes');
const userRoutes = require('./routes/userRoutes');
const auditRoutes = require('./routes/auditRoutes');
const statsRoutes = require('./routes/statsRoutes');
const aiRoutes = require('./routes/aiRoutes');


const app = express();

// 1. Basic Security Middleware
// Adjust helmet contentSecurityPolicy to allow static upload serving if needed
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows image previews from the express server
}));

// Configure CORS to allow access from local Vite frontend
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// 2. Body Parser Middleware
app.use(express.json());

// Serve static uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. Connect to MongoDB Database
connectDB();

// 4. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/system', statsRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'Active', 
    environment: process.env.NODE_ENV, 
    timestamp: new Date().toISOString() 
  });
});

// 5. Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

// 6. Start Server Listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`=============================================================`);
  console.log(`[SERVER RUNNING] DRRP Backend running on port ${PORT}`);
  console.log(`[API ENVIRONMENT] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=============================================================`);
});
