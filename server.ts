import express from 'express';
import cors from 'cors';
import authRouter from './src/routes/authRouter'

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({message: "running"});
});

app.use('/api/auth', authRouter)


export default app;