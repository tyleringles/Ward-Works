
// Routes for admin-only pages (managings user accounts and roles)

const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const isAdmin = require('../middleware/is-admin'); 

// Shows list of all users and their roles
router.get('/users', isAdmin, adminController.userList);

// POST /admin/users/:id/role Change a user's role (member ↔ admin)
router.post('/users/:id/role', isAdmin, adminController.updateUserRole);

module.exports = router;
