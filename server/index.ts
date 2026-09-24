import 'dotenv/config';
import dns from 'dns';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

// Fix for Windows / ISP DNS resolvers failing on mongodb+srv SRV lookups
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('DNS server fallback warning:', e);
}
import authRoutes from './routes/authRoutes';
import workspaceRoutes from './routes/workspaceRoutes';
import syncRoutes from './routes/syncRoutes';
import entityRoutes from './routes/entityRoutes';

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const MONGODB_URI = process.env.MONGODB_URI;

// ----------------------------------------------------
// CORS POLICY (SECURED FOR PRODUCTION & LOCAL DEV)
// ----------------------------------------------------
const defaultAllowedOrigins: (string | RegExp)[] = [
  'https://pscvault.vercel.app',
  /^https:\/\/pscvault(-[a-z0-9-]+)?\.vercel\.app$/, // Vercel preview branch deployments
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:1420',
  'http://127.0.0.1:1420',
  'tauri://localhost',
  'https://tauri.localhost',
];

const configuredOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((u) => u.trim()).filter(Boolean)
  : [];

const allowedOrigins = [...defaultAllowedOrigins, ...configuredOrigins];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server health checks)
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some((allowed) => {
        if (typeof allowed === 'string') return allowed === origin;
        if (allowed instanceof RegExp) return allowed.test(origin);
        return false;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy rejection: Origin ${origin} not allowed.`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id'],
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ----------------------------------------------------
// HEALTH CHECK ENDPOINTS (PUBLIC, NO AUTH REQUIRED)
// ----------------------------------------------------
const getDatabaseStatus = (): 'connected' | 'connecting' | 'disconnecting' | 'disconnected' => {
  switch (mongoose.connection.readyState) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'disconnected';
  }
};

const healthHandler = (_req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'PSCVault API',
    database: getDatabaseStatus(),
    timestamp: new Date().toISOString(),
  });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// ----------------------------------------------------
// REGISTER API ROUTES
// ----------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api', entityRoutes);

// ----------------------------------------------------
// GLOBAL ERROR HANDLER
// ----------------------------------------------------
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err?.message || err);
  res.status(err?.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error.'
      : (err?.message || 'Internal server error.'),
  });
});

// ----------------------------------------------------
// MONGODB LIFECYCLE LISTENERS
// ----------------------------------------------------
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err?.message || 'Unknown database error');
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection lost. Falling back to in-memory store.');
});

// ----------------------------------------------------
// PRODUCTION-READY SERVER START
// ----------------------------------------------------
export async function startServer() {
  if (MONGODB_URI) {
    try {
      if (mongoose.connection.readyState === 0) {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log('MongoDB connected successfully');
      }
    } catch (err: any) {
      console.warn('MongoDB connection failed:', err?.message || 'Connection timeout');
      console.warn('Backend will continue operating with in-memory fallback store.');
    }
  } else {
    if (process.env.NODE_ENV === 'production') {
      console.error('Error: MONGODB_URI environment variable is missing in production!');
    } else {
      console.log('MONGODB_URI not set. Running in local in-memory fallback mode.');
    }
  }

  return app.listen(Number(PORT), HOST, () => {
    console.log(`PSCVault Backend API listening on ${HOST}:${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
