import express from 'express';
import { createCoupon, getAllCoupons, validateCoupon, toggleCoupon, deleteCoupon } from '../controllers/couponController.js';

const couponRouter = express.Router();

couponRouter.post('/create', createCoupon);
couponRouter.get('/all', getAllCoupons);
couponRouter.post('/validate', validateCoupon);
couponRouter.post('/toggle', toggleCoupon);
couponRouter.post('/delete', deleteCoupon);

export default couponRouter;
