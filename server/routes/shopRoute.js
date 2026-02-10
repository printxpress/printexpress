import express from 'express';
import { getShopSettings, updateShopSettings } from '../controllers/shopController.js';
import authSeller from '../middlewares/authSeller.js';

const shopRouter = express.Router();

shopRouter.get('/settings', getShopSettings);
shopRouter.post('/update', authSeller, updateShopSettings);

export default shopRouter;
