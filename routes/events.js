
// Handles both the public calendar view and all admin event tools.

const express = require('express');
const router = express.Router();

const eventController = require('../controllers/eventController');
const isAuth = require('../middleware/is-auth');
const isAdmin = require('../middleware/is-admin');

// PUBLIC CALENDAR Anyone can view the calendar of upcoming events
router.get('/', eventController.publicList);

// ADMIN ACESS EDIT MODE

// List all events (admin dashboard)
router.get('/admin', isAuth, isAdmin, eventController.adminList);

// Show form to create a new event
router.get('/admin/new', isAuth, isAdmin, eventController.showNew);

// Create a new event
router.post('/admin', isAuth, isAdmin, eventController.create);

// Show edit form for an existing event
router.get('/admin/:id/edit', isAuth, isAdmin, eventController.showEdit);

// Update an event
router.put('/admin/:id', isAuth, isAdmin, eventController.update);

// Delete an event
router.delete('/admin/:id', isAuth, isAdmin, eventController.delete);

module.exports = router;
