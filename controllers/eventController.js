
//  handles all the event ward calendar stuff public calendar, admin tools, and full CRUD routes for this are in routes/events.js.

const mongoose = require('mongoose');
const Event = require('../models/Event');


// labels for the calendar view.
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];


// toDateKey turns a JS date into YYYY-MM-DD I used this to group events by day on the calendar grid.
function toDateKey(d) {
  return d.toISOString().substring(0, 10);
}


// validateEventInput cleans,checks events form fields 
function validateEventInput(body) {
  const errors = [];

  const title = (body.title || '').trim();
  const description = (body.description || '').trim();
  const startDate = (body.startDate || '').trim();
  const startTime = (body.startTime || '').trim();
  const location = (body.location || '').trim();
  const recurrence = (body.recurrence || 'none').trim();

  if (!title) {
    errors.push('Event title is required.');
  } else if (title.length < 2 || title.length > 120) {
    errors.push('Event title must be between 2 and 120 characters.');
  }

  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    errors.push('A valid event date is required.');
  }

  if (startTime && !/^\d{2}:\d{2}$/.test(startTime)) {
    errors.push('Event time must be in HH:MM format.');
  }

  if (description.length > 1000) {
    errors.push('Description must be 1000 characters or fewer.');
  }

  if (location.length > 200) {
    errors.push('Location must be 200 characters or fewer.');
  }

  const allowedRecurrence = ['none', 'weekly', 'monthly', 'yearly'];
  const finalRecurrence = allowedRecurrence.includes(recurrence)
    ? recurrence
    : 'none';

  const cleaned = {
    title,
    description,
    startDate,
    startTime,
    location,
    recurrence: finalRecurrence
  };

  return { errors, cleaned };
}


// exports.publicList — GET /events builds the full public calendar month view.
// definitely one of the harder parts because of all the date math  grid layout this was not done in class had Chat help alot cause it was kinda like a display view 
exports.publicList = async (req, res) => {
  try {
    const today = new Date();

    let year = parseInt(req.query.year, 10) || today.getFullYear();
    let month = parseInt(req.query.month, 10) || today.getMonth() + 1;

    if (year < 1900 || year > 2100) year = today.getFullYear();
    if (month < 1 || month > 12) month = today.getMonth() + 1;

    const firstOfMonth = new Date(year, month - 1, 1);
    const lastOfMonth = new Date(year, month, 0);

    const startRange = firstOfMonth;
    const endRange = new Date(year, month, 1);

    const events = await Event.find({
      startDate: { $gte: startRange, $lt: endRange }
    })
      .sort({ startDate: 1 })
      .lean();

    const eventsByDate = {};
    events.forEach((e) => {
      if (!e.startDate) return;
      const key = toDateKey(e.startDate);
      if (!eventsByDate[key]) eventsByDate[key] = [];
      eventsByDate[key].push(e);
    });

    const daysInMonth = lastOfMonth.getDate();
    const weeks = [];
    let currentDay = 1;

    const jsFirstDay = firstOfMonth.getDay();
    const offset = (jsFirstDay + 6) % 7;

    while (currentDay <= daysInMonth) {
      const week = [];

      for (let i = 0; i < 7; i++) {
        if (weeks.length === 0 && i < offset) {
          week.push(null);
        } else if (currentDay > daysInMonth) {
          week.push(null);
        } else {
          const dateObj = new Date(year, month - 1, currentDay);
          const key = toDateKey(dateObj);

          week.push({
            day: currentDay,
            dateKey: key,
            events: eventsByDate[key] || []
          });

          currentDay++;
        }
      }

      weeks.push(week);
    }

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    const calendar = {
      month,
      year,
      monthName: MONTH_NAMES[month - 1],
      weeks,
      prev: { month: prevMonth, year: prevYear },
      next: { month: nextMonth, year: nextYear }
    };

    res.render('events/list', {
      title: 'Ward Calendar',
      calendar,
      error: null
    });
  } catch (err) {
    console.error('Error loading events:', err);
    res.status(500).send('Error loading events');
  }
};


// exports.adminList — GET /events/admin admin list of events in a simple table view.
exports.adminList = async (req, res) => {
  try {
    const events = await Event.find()
      .sort({ startDate: 1 })
      .lean();

    res.render('events/admin-list', {
      title: 'Manage Events',
      events,
      error: null
    });
  } catch (err) {
    console.error('Error loading admin events:', err);
    res.status(500).send('Error loading events');
  }
};

exports.listAdmin = exports.adminList;


// exports.showNew — GET /events/admin/new hows a blank “new event” form
exports.showNew = (req, res) => {
  res.render('events/new', {
    title: 'New Event',
    errors: [],
    event: {
      title: '',
      startDate: '',
      startTime: '',
      location: '',
      description: '',
      recurrence: 'none'
    }
  });
};


// exports.create — POST /events/admin makes a brand new event validation helper as well
exports.create = async (req, res) => {
  try {
    const { errors, cleaned } = validateEventInput(req.body);

    if (errors.length > 0) {
      return res.status(400).render('events/new', {
        title: 'New Event',
        errors,
        event: cleaned
      });
    }

    await Event.create(cleaned);
    res.redirect('/events/admin');
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).send('Error creating event');
  }
};


// exports.showEdit — GET /events/admin/:id/edit loads an event so it can be edited
exports.showEdit = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send('Invalid event ID.');
    }

    const event = await Event.findById(id).lean();
    if (!event) {
      return res.status(404).send('Event not found.');
    }

    res.render('events/edit', {
      title: 'Edit Event',
      event,
      errors: []
    });
  } catch (err) {
    console.error('Error loading event for edit:', err);
    res.status(500).send('Error loading event');
  }
};


// exports.update — POST /events/admin/:id updates an existing event merging event.toObject() with cleaned values was the part that took more thought.
exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send('Invalid event ID.');
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).send('Event not found.');
    }

    const { errors, cleaned } = validateEventInput(req.body);

    if (errors.length > 0) {
      return res.status(400).render('events/edit', {
        title: 'Edit Event',
        event: { ...event.toObject(), ...cleaned },
        errors
      });
    }

    await Event.findByIdAndUpdate(id, cleaned);
    res.redirect('/events/admin');
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).send('Error updating event');
  }
};


// exports.delete — POST /events/admin/:id/delete deletes an event
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.isValidObjectId(id)) {
      console.warn('Invalid ID submitted for delete:', id);
      return res.redirect('/events/admin');
    }

    await Event.findByIdAndDelete(id);
    res.redirect('/events/admin');
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).send('Error deleting event');
  }
};
