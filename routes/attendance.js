
// Routes for leaders/admins to take attendance and for members to check in.

const express = require('express');
const router = express.Router();

const attendanceController = require('../controllers/attendanceController');
const isAuth = require('../middleware/is-auth'); // must be logged in to access any attendance features

// GET /attendance Show the take-attendance page for a specific date
router.get('/', isAuth, attendanceController.showTake);

// POST /attendance Save attendance submitted by a leader/admin
router.post('/', isAuth, attendanceController.save);


// MEMBER SELF CHECK-IN
// GET /attendance/checkin Member sees their own attendance check-in page
router.get('/checkin', isAuth, attendanceController.showCheckin);

// POST /attendance/checkin Member submits their own check-in
router.post('/checkin', isAuth, attendanceController.saveCheckin);



// GET /attendance/history Show the full attendance history for all members
router.get('/history', isAuth, attendanceController.history);

// GET /attendance/member/:id Show attendance history for a specific member
router.get('/member/:id', isAuth, attendanceController.memberHistory);

module.exports = router;
