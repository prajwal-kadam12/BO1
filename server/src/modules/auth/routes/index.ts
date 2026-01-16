import { Router } from 'express';

export const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  // TODO: Implement actual authentication
  res.json({
    success: true,
    data: {
      user: {
        id: '1',
        email: email || 'admin@Billing.com',
        name: 'Admin User',
        role: 'admin',
      },
      token: 'mock-jwt-token',
    },
    message: 'Login successful',
  });
});

authRouter.post('/register', (req, res) => {
  const { email, password, name } = req.body;
  // TODO: Implement actual registration
  res.json({
    success: true,
    data: {
      user: {
        id: '1',
        email,
        name,
        role: 'viewer',
      },
    },
    message: 'Registration successful',
  });
});

authRouter.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logout successful' });
});

authRouter.get('/me', (req, res) => {
  // TODO: Get from JWT token
  res.json({
    success: true,
    data: {
      id: '1',
      email: 'admin@Billing.com',
      name: 'Admin User',
      role: 'admin',
    },
  });
});

export default authRouter;
