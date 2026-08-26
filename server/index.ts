import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes';
import workspaceRoutes from './routes/workspaceRoutes';
import syncRoutes from './routes/syncRoutes';
import entityRoutes from './routes/entityRoutes';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pscvault_cloud_db';

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'PSCVault Cloud Backend API', timestamp: new Date() });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api', entityRoutes);

// MongoDB Atlas Connection
export async function startServer() {
  try {
    if (mongoose.connection.readyState === 0) {
      console.log('⏳ Connecting to MongoDB Cloud Database...');
      await mongoose.connect(MONGODB_URI);
      console.log('✅ MongoDB Cloud Database Connected Successfully!');
    }
  } catch (err: any) {
    console.warn('⚠️ MongoDB Atlas connection warning:', err.message);
  }

  return app.listen(PORT, () => {
    console.log(`🚀 PSCVault Cloud Backend API running at http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
