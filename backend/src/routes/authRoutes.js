import express from 'express';
import { 
  register, 
  login, 
  verifyEmail, 
  getProfile 
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify/:token', verifyEmail);
router.get('/profile', protect, getProfile);

export default router;