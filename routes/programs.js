
// theses are all the routes for the sacrament program

const express = require('express');
const router = express.Router();

const programController = require('../controllers/programController');
const isAuth = require('../middleware/is-auth');
const isAdmin = require('../middleware/is-admin');


// Member ROUTES
router.get('/', programController.list);
router.get('/:id', programController.show);
router.get('/:id/pdf', programController.downloadPdf);//lists, the view and to download the PDF not learned in class


// ADMIN ROUTES
router.post('/new', isAuth, isAdmin, programController.create);
router.get('/:id/admin-pdf', isAuth, isAdmin, programController.downloadAdminPdf);
router.get('/:id/edit', isAuth, isAdmin, programController.edit);
router.post('/:id/edit', isAuth, isAdmin, programController.update);//makes a new program and the ablity to edit and submits edit to existing ones too

module.exports = router;
