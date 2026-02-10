import express from 'express';
import { createQuery, getAllQueries, getUserQueries } from '../controllers/queryController.js';
import authUser from '../middlewares/authUser.js';
import authSeller from '../middlewares/authSeller.js';

const queryRouter = express.Router();

queryRouter.post('/create', authUser, createQuery);
queryRouter.get('/user', authUser, getUserQueries);
queryRouter.get('/all', authSeller, getAllQueries);

export default queryRouter;
