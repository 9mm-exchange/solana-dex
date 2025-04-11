import express from 'express';
import { getCustomTokens, addToken } from '../controllers/tokenController';

const router = express.Router();

router.get('/custom', getCustomTokens);
router.post('/add', addToken);

export default router; 