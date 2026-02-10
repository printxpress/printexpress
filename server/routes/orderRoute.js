import express from 'express';
import { getAllOrders, getUserOrders, placePrintOrder, updateOrderStatus, createPosOrder, cleanupOldFiles } from '../controllers/orderController.js';
import authUser from '../middlewares/authUser.js';
import authSeller from '../middlewares/authSeller.js';
import { upload } from '../configs/multer.js';

const orderRouter = express.Router();

orderRouter.post('/print', upload.array('files'), authUser, placePrintOrder);
orderRouter.get('/user', authUser, getUserOrders);
orderRouter.post('/pos', authSeller, createPosOrder);
orderRouter.get('/all', authSeller, getAllOrders);
orderRouter.post('/update-status', authSeller, updateOrderStatus);
orderRouter.delete('/cleanup', authSeller, cleanupOldFiles);

export default orderRouter;