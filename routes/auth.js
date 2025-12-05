
// Routes for login, logout, and account creation.

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// LOGIN

// GET /auth/login Show the login page
router.get('/login', authController.getLogin);

// POST /auth/login Handle login form submission
router.post('/login', authController.postLogin);


// SIGNUP

// GET /auth/signup Show the signup (create account) page
router.get('/signup', authController.getSignup);

// POST /auth/signupHandle signup submission
router.post('/signup', authController.postSignup);

// LOGOUT
// POST /auth/logout Log the user out
router.post('/logout', authController.postLogout);

module.exports = router;
