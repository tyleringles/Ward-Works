// Public-facing “Church Info” page that shows the next ward events

const express = require('express');
const router = express.Router();

const Event = require('../models/Event');

// GET /church-info Show the church information page and upcoming events
router.get('/church-info', async (req, res) => {
  try {
    // Determines "today" so we only show upcoming events
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    //Load the next 5 events occurring today or late
    const events = await Event.find({ startDate: { $gte: startOfToday } })
      .sort({ startDate: 1 })
      .limit(5)
      .lean();

    //Renders the page with events
    res.render('church-info', {
      title: 'Church Info',
      events
    });

  } catch (err) {
    console.error('Error loading events for Church Info:', err);

    // Render page even if something fails
    res.render('church-info', {
      title: 'Church Info',
      events: []
    });
  }
});

module.exports = router;
