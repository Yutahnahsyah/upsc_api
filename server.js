import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import router from './routes/router.js';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173'
}));
app.use(express.json());
app.use('/api', router);
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT} and listening for external connections`);
});