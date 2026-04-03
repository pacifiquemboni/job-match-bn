// src/routes/authRoutes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validateRequest } from '../utils/validation';

const router = Router();
const authController = new AuthController();

router.post('/register', validateRequest('register'), authController.register);
router.post('/login', validateRequest('login'), authController.login);

export default router;