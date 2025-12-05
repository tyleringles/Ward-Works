
//  handles all the calling (church assignment) stuff.
// routes for this live in routes/callings.js — all the calling pages hit this file.

const mongoose = require('mongoose');
const Calling = require('../models/Calling');
const Member = require('../models/Member');


// validateCallingInputchecks the calling form input and trims/validates it.
// I used one helper for both create + update so the code stays clean.
// also handles the checkbox boolean stuff which I didn't always understand well
function validateCallingInput(body) {
  const errors = [];

  const title = (body.title || '').trim();
  const organization = (body.organization || '').trim();
  const memberId = (body.member || '').trim();
  let notes = (body.notes || '').trim();

  const active =
    body.active === 'on' ||
    body.active === 'true' ||
    body.active === true;

  if (!title) {
    errors.push('Calling title is required.');
  } else if (title.length < 2 || title.length > 100) {
    errors.push('Calling title must be between 2 and 100 characters.');
  }

  if (!organization) {
    errors.push('Organization is required.');
  } else if (organization.length < 2 || organization.length > 100) {
    errors.push('Organization must be between 2 and 100 characters.');
  }

  if (notes.length > 500) {
    errors.push('Notes must be 500 characters or fewer.');
    notes = notes.slice(0, 500);
  }

  if (memberId && !mongoose.isValidObjectId(memberId)) {
    errors.push('Invalid member selected.');
  }

  const cleaned = { title, organization, memberId, notes, active };
  return { errors, cleaned };
}


// exports.list — GET /callings just loads all callings and shows them on the list page.
// I used populate so it shows the member's actual name instead of an ID (this part felt more advanced).
exports.list = async (req, res) => {
  try {
    const callings = await Calling.find()
      .populate('member')
      .sort({ organization: 1, title: 1 })
      .lean();

    res.render('callings/list', {
      title: 'Callings',
      callings,
      error: null
    });
  } catch (err) {
    console.error('Error loading callings:', err);

    res.render('callings/list', {
      title: 'Callings',
      callings: [],
      error: 'There was a problem loading callings.'
    });
  }
};


//  exports.showNew — GET /callings/new shows the “new calling” form just loads members for the dropdown so you can assign a calling to someone.
exports.showNew = async (req, res) => {
  try {
    const members = await Member.find()
      .sort({ lastName: 1, firstName: 1 })
      .lean();

    res.render('callings/new', {
      title: 'New Calling',
      members,
      errors: [],
      formData: {}
    });
  } catch (err) {
    console.error('Error loading members for calling form:', err);
    res.redirect('/callings');
  }
};


//  exports.create — POST /callings saves the new calling from the form.
// reused my validation helper so this part didn’t get messy.
// linking members was a little extra learning for me.
exports.create = async (req, res) => {
  try {
    const { errors, cleaned } = validateCallingInput(req.body);

    const members = await Member.find()
      .sort({ lastName: 1, firstName: 1 })
      .lean();

    if (errors.length > 0) {
      return res.status(400).render('callings/new', {
        title: 'New Calling',
        members,
        errors,
        formData: cleaned
      });
    }

    const callingData = {
      title: cleaned.title,
      organization: cleaned.organization,
      notes: cleaned.notes,
      active: cleaned.active
    };

    if (cleaned.memberId) {
      callingData.member = cleaned.memberId;
    }

    await Calling.create(callingData);
    res.redirect('/callings');
  } catch (err) {
    console.error('Error creating calling:', err);
    res.redirect('/callings');
  }
};


// exports.showEdit — GET /callings/:id/edit hows the edit form for a specific calling  pretty straightforward ,load the calling  and members for the dropdown.
exports.showEdit = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send('Invalid calling ID.');
    }

    const calling = await Calling.findById(id).lean();
    if (!calling) {
      return res.status(404).send('Calling not found.');
    }

    const members = await Member.find()
      .sort({ lastName: 1, firstName: 1 })
      .lean();

    res.render('callings/edit', {
      title: 'Edit Calling',
      calling,
      members,
      errors: []
    });
  } catch (err) {
    console.error('Error loading calling for edit:', err);
    res.redirect('/callings');
  }
};


// exports.update — PUT /callings/:id updates an existing calling 
// this one was the tricky because I had to merge the old data with whatever  the user typed so their changes don’t disappear when errors happen
exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send('Invalid calling ID.');
    }

    const calling = await Calling.findById(id);
    if (!calling) {
      return res.status(404).send('Calling not found.');
    }

    const { errors, cleaned } = validateCallingInput(req.body);

    const members = await Member.find()
      .sort({ lastName: 1, firstName: 1 })
      .lean();

    if (errors.length > 0) {
      const callingForView = {
        ...calling.toObject(),
        title: cleaned.title,
        organization: cleaned.organization,
        notes: cleaned.notes,
        active: cleaned.active,
        member: cleaned.memberId || null
      };

      return res.status(400).render('callings/edit', {
        title: 'Edit Calling',
        calling: callingForView,
        members,
        errors
      });
    }

    const updatedData = {
      title: cleaned.title,
      organization: cleaned.organization,
      notes: cleaned.notes,
      active: cleaned.active,
      member: cleaned.memberId || null
    };

    await Calling.findByIdAndUpdate(id, updatedData);
    res.redirect('/callings');
  } catch (err) {
    console.error('Error updating calling:', err);
    res.redirect('/callings');
  }
};


// exports.delete — DELETE /callings/:id deletes a calling, super simple just checks the ID and deletes it.
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.isValidObjectId(id)) {
      console.warn('Attempted delete with invalid ID:', id);
      return res.redirect('/callings');
    }

    await Calling.findByIdAndDelete(id);
    res.redirect('/callings');
  } catch (err) {
    console.error('Error deleting calling:', err);
    res.redirect('/callings');
  }
};
