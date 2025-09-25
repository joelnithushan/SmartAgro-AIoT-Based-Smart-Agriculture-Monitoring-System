import express from 'express';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

// Test endpoint for validation
router.post('/test-login', validateRequest('login'), (req, res) => {
  res.json({
    success: true,
    message: 'Login validation passed',
    data: req.body
  });
});

router.post('/test-register', validateRequest('register'), (req, res) => {
  res.json({
    success: true,
    message: 'Registration validation passed',
    data: req.body
  });
});

router.post('/test-device', validateRequest('deviceRegistration'), (req, res) => {
  res.json({
    success: true,
    message: 'Device registration validation passed',
    data: req.body
  });
});

export default router;
