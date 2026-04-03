import { Router, Request, Response } from 'express';
import { AuthService } from './auth.service';

const router = Router();
const authService = new AuthService();

/**
 * POST /auth/register
 * Register a new user (WORKER or CLIENT)
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    // Basic validation
    if (!email || !password || !role) {
      return res.status(400).json({
        message: 'Email, password, and role are required',
      });
    }

    if (!['WORKER', 'CLIENT'].includes(role)) {
      return res.status(400).json({
        message: 'Invalid role. Must be WORKER or CLIENT',
      });
    }

    const token = await authService.register({
      email,
      password,
      role,
    });

    return res.status(201).json({
      message: 'User registered successfully',
      access_token: token,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || 'Registration failed',
    });
  }
});

/**
 * POST /auth/login
 * Login user
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    const token = await authService.login({
      email,
      password,
    });

    return res.status(200).json({
      message: 'Login successful',
      access_token: token,
    });
  } catch (error: any) {
    return res.status(401).json({
      message: error.message || 'Invalid credentials',
    });
  }
});

export default router;