import { Router } from 'express';
import { listAdsHandler } from './ads.controller';

export const adsRouter = Router();
adsRouter.get('/', listAdsHandler);
