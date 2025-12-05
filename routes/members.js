
// Routes for listing, viewing, creating, editing, and deleting ward members.

const express = require('express');
const router = express.Router();

const memberController = require('../controllers/memberController');
const isAuth = require('../middleware/is-auth');
const upload = require('../middleware/upload'); // handles profile photo uploads


//MEMBER DIRECTORY
// List all members (directory)
router.get('/', isAuth, memberController.list);

// Show "New Member" form
router.get('/new', isAuth, memberController.showNew);

// Create a new member (photo upload allowed)
router.post('/', isAuth, upload.single('photo'), memberController.create);

//
// INDIVIDUAL MEMBER PAGES
//

// View details for a single member
router.get('/:id', isAuth, memberController.show);

// Show edit form for a member
router.get('/:id/edit', isAuth, memberController.showEdit);

// Update member (photo upload optional)
router.put('/:id', isAuth, upload.single('photo'), memberController.update);

// Confirm delete page
router.get('/:id/delete-confirm', isAuth, memberController.confirmDelete);

// Delete the member
router.delete('/:id', isAuth, memberController.delete);

module.exports = router;
