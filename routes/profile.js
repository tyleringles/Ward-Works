
// Routes for viewing and updating the logged-in user's profile information.

const express = require('express');
const router = express.Router();

const profileController = require('../controllers/profileController');
const isAuth = require('../middleware/is-auth');

// Show the logged-in user's profile page
router.get('/', isAuth, profileController.showProfile);

// Update fields like name, email, phone, and profile photo
router.post('/', isAuth, profileController.updateProfile);

// Update (change) the user's password
router.post('/password', isAuth, profileController.updatePassword);

module.exports = router;
