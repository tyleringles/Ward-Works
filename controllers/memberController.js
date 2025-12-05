// handles all the member/directory stuff.

const mongoose = require('mongoose');
const Member = require('../models/Member');

// sends an email when a new member gets added.
// not done in class so was new waters
const { sendNewMemberNotification } = require('../utils/email');


// validateMemberInput, cleans,checks all the member form fields checks names, optional email/phone, and makes sure gender is allowed.
function validateMemberInput(body) {
  const errors = [];

  const firstName = (body.firstName || '').trim();
  const lastName = (body.lastName || '').trim();
  const email = (body.email || '').trim();
  const phone = (body.phone || '').trim();
  let gender = (body.gender || 'unknown').trim();

  if (!firstName) {
    errors.push('First name is required.');
  } else if (firstName.length > 50) {
    errors.push('First name must be 50 characters or fewer.');
  }

  if (!lastName) {
    errors.push('Last name is required.');
  } else if (lastName.length > 50) {
    errors.push('Last name must be 50 characters or fewer.');
  }

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Please enter a valid email address.');
    }
  }

  if (phone) {
    const phoneRegex = /^[0-9\-\s()+]{7,20}$/;
    if (!phoneRegex.test(phone)) {
      errors.push('Please enter a valid phone number.');
    }
  }

  const allowedGenders = ['male', 'female', 'other', 'unknown'];
  if (!allowedGenders.includes(gender)) {
    gender = 'unknown';
  }

  const cleaned = { firstName, lastName, email, phone, gender };
  return { errors, cleaned };
}


// exports.list — GET /members loads the full member list with search sorting.
// this part felt more advanced since it builds dynamic filters sort options.
exports.list = async (req, res) => {
  try {
    const searchQuery = req.query.q?.trim() || '';
    const sortOption = req.query.sort;

    let filter = {};

    if (searchQuery) {
      const rx = new RegExp(searchQuery, 'i');
      filter = {
        $or: [
          { firstName: rx },
          { lastName: rx },
          { email: rx },
          { phone: rx }
        ]
      };
    }

    let sortSpec = { lastName: 1, firstName: 1 };

    if (sortOption === 'last_desc') sortSpec = { lastName: -1, firstName: -1 };
    if (sortOption === 'first_asc') sortSpec = { firstName: 1, lastName: 1 };
    if (sortOption === 'first_desc') sortSpec = { firstName: -1, lastName: -1 };

    const members = await Member.find(filter).sort(sortSpec).lean();

    res.render('members/list', {
      title: 'Members',
      members,
      query: req.query,
      error: null
    });

  } catch (err) {
    console.error('Error loading members:', err);

    res.render('members/list', {
      title: 'Members',
      members: [],
      query: req.query,
      error: 'Unable to load members.'
    });
  }
};


// exports.show — GET /members/:id shows details for a single member.
exports.show = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send('Invalid member ID.');
    }

    const member = await Member.findById(id).lean();
    if (!member) {
      return res.status(404).send('Member not found');
    }

    res.render('members/show', {
      title: 'Member Details',
      member
    });

  } catch (err) {
    console.error('Error finding member:', err);
    res.redirect('/members');
  }
};


// exports.showNew — GET /members/new  shows a blank new member form
exports.showNew = (req, res) => {
  res.render('members/new', {
    title: 'New Member',
    errors: [],
    formData: {}
  });
};


// exports.create — POST /members  creates a new member
exports.create = async (req, res) => {
  try {
    const { errors, cleaned } = validateMemberInput(req.body);

    if (errors.length > 0) {
      return res.status(400).render('members/new', {
        title: 'New Member',
        errors,
        formData: cleaned
      });
    }

    let photoPath = null;
    if (req.file) {
      photoPath = '/uploads/' + req.file.filename;
    }

    const member = await Member.create({
      ...cleaned,
      photo: photoPath
    });

    try {
      await sendNewMemberNotification(member);
    } catch (emailErr) {
      console.warn('New member email failed:', emailErr.message);
    }

    res.redirect('/members');
  } catch (err) {
    console.error('Error creating member:', err);
    res.redirect('/members/new');
  }
};


// exports.showEdit — GET /members/:id/edit loads a member into the edit form.
exports.showEdit = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send('Invalid member ID.');
    }

    const member = await Member.findById(id).lean();
    if (!member) {
      return res.status(404).send('Member not found');
    }

    res.render('members/edit', {
      title: 'Edit Member',
      member,
      errors: []
    });

  } catch (err) {
    console.error('Error loading member for edit:', err);
    res.redirect('/members');
  }
};


// exports.update — PUT /members/:id saves changes to an existing member merging existing.toObject() with cleaned values helps keep the user’s form data when validation fails.
exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send('Invalid member ID.');
    }

    const existing = await Member.findById(id);
    if (!existing) {
      return res.status(404).send('Member not found');
    }

    const { errors, cleaned } = validateMemberInput(req.body);

    if (errors.length > 0) {
      const memberForView = {
        ...existing.toObject(),
        ...cleaned
      };

      return res.status(400).render('members/edit', {
        title: 'Edit Member',
        member: memberForView,
        errors
      });
    }

    const updatedData = { ...cleaned };

    if (req.file) {
      updatedData.photo = '/uploads/' + req.file.filename;
    }

    await Member.findByIdAndUpdate(id, updatedData);

    res.redirect('/members');

  } catch (err) {
    console.error('Update error:', err);
    res.redirect(`/members/${req.params.id}/edit`);
  }
};


// exports.confirmDelete — GET /members/:id/delete-confirm shows a are you sure? page before deleting a member simple ID check to show page.
exports.confirmDelete = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send('Invalid member ID.');
    }

    const member = await Member.findById(id).lean();
    if (!member) {
      return res.status(404).send('Member not found');
    }

    res.render('members/confirmDelete', {
      title: 'Delete Member',
      member
    });

  } catch (err) {
    console.error('Error loading delete confirmation:', err);
    res.redirect('/members');
  }
};


// exports.delete — DELETE /members/:id deletes a member — straightforward just checks the ID and deletes it.
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.isValidObjectId(id)) {
      console.warn('Invalid delete ID:', id);
      return res.redirect('/members');
    }

    await Member.findByIdAndDelete(id);

    res.redirect('/members');

  } catch (err) {
    console.error('Delete error:', err);
    res.redirect('/members');
  }
};
