import express from 'express';
import cors from 'cors';
import newsRouter from './routes/newsRouter'
import authRouter from './routes/authRouter'
import scoreRouter from './routes/scoreRouter'

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({message: "running"});
});

app.use('/api/score', scoreRouter);

app.use('/api/news', newsRouter)

app.use('/api/auth', authRouter)


export default app;