import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './db';
import authRoutes from './routes/auth';
import boardRoutes from './routes/boards';
import thoughtRoutes from './routes/thoughts';
import connectionRoutes from './routes/connections';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for image Data URLs

// Initialize Database
initDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/thoughts', thoughtRoutes);
app.use('/api/connections', connectionRoutes);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
