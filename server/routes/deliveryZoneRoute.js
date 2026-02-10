import express from 'express';
import { checkDelivery, getAllZones, addUpdateZone, deleteZone } from '../controllers/deliveryZoneController.js';
import authSeller from '../middlewares/authSeller.js';

const deliveryZoneRouter = express.Router();

deliveryZoneRouter.get('/all', authSeller, getAllZones);
deliveryZoneRouter.get('/check/:pincode', checkDelivery);
deliveryZoneRouter.post('/add', authSeller, addUpdateZone);
deliveryZoneRouter.delete('/delete/:id', authSeller, deleteZone);

export default deliveryZoneRouter;
