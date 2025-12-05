
// Routes for creating, editing, listing, and deleting ward callings.

const express = require('express');
const router = express.Router();

const callingController = require('../controllers/callingController');
const isAuth = require('../middleware/is-auth'); // must be logged in to manage callings


// GET /callings Shows the full list of callings
router.get('/', isAuth, callingController.list);


// GET /callings/new shows form to create a new calling
router.get('/new', isAuth, callingController.showNew);

// POST /callings Creates a new calling record
router.post('/', isAuth, callingController.create);


// GET /callings/:id/edit shows edit form for a specific calling
router.get('/:id/edit', isAuth, callingController.showEdit);

// PUT /callings/:id Save updates to an existing calling
router.put('/:id', isAuth, callingController.update);


// DELETE /callings/:id Removes a calling from the system
router.delete('/:id', isAuth, callingController.delete);

module.exports = router;
