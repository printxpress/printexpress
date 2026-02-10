import express from 'express';
import { getPricing, updatePricing } from '../controllers/pricingController.js';

const pricingRouter = express.Router();

pricingRouter.get('/', getPricing);
pricingRouter.post('/update', updatePricing); // TODO: Add Admin middleware

export default pricingRouter;
