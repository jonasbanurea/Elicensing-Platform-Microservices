const express = require('express');
const User = require('../models/User');
const { validateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Get peran (role and access rights) for a specific user
router.get('/:id/peran', validateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Simple access mapping — extend as needed
    const accessByRole = {
      Pemohon: ['create_permohonan', 'view_own_status'],
      Admin: ['manage_users', 'view_reports', 'manage_system'],
      OPD: ['review_permohonan', 'comment'],
      Pimpinan: ['approve_permohonan', 'view_reports'],
    };

    const access = accessByRole[user.role] || [];

    res.json({ id: user.id, username: user.username, role: user.role, access });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

module.exports = router;