import express from 'express';
import { getCustomTokens, addToken, getTokenList, removeToken } from '../controllers/tokenController';

const router = express.Router();

router.post('/custom', getCustomTokens);
router.post('/add', addToken);
router.post('/default', getTokenList);
router.delete('/remove', removeToken);

export default router; 