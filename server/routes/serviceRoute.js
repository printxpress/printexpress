import express from 'express';
import { getServices, addService, updateService, deleteService } from '../controllers/serviceController.js';

const serviceRouter = express.Router();

serviceRouter.get('/', getServices);
serviceRouter.post('/add', addService); // TODO: Add Admin middleware
serviceRouter.post('/update', updateService); // TODO: Add Admin middleware
serviceRouter.post('/delete', deleteService); // TODO: Add Admin middleware

export default serviceRouter;
