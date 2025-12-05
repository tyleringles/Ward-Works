// handles everything for the logged in user's own profile including viewing profile info, updating contact info + avatar, and changing password
// routes for this are located in the routes/profile.js.

const bcrypt = require('bcryptjs');       // for hashing passwords (not done in class and moore diffcult for a coder of my level)
const User = require('../models/User');
const Member = require('../models/Member');


// basic helper checks for email, phone, and password I reused these so validation stays consistent everywhere
function isValidEmail(email) {
  if (!email) return false;
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
}

function isValidPhone(phone) {
  if (!phone) return true; 
  return /^[0-9\-\s()+]{7,20}$/.test(phone.trim());
}

function isValidPassword(password) {
  return typeof password === 'string' && password.trim().length >= 6;
}


// validateProfileInput trims and checks user profile fieldskeeps create/update cleaner.
function validateProfileInput(body) {
  const errors = [];

  const firstName = (body.firstName || '').trim();
  const lastName = (body.lastName || '').trim();
  const email = (body.email || '').trim();
  const phone = (body.phone || '').trim();

  if (!firstName) errors.push('First name is required.');
  else if (firstName.length > 50) errors.push('First name must be 50 characters or fewer.');

  if (!lastName) errors.push('Last name is required.');
  else if (lastName.length > 50) errors.push('Last name must be 50 characters or fewer.');

  if (email && !isValidEmail(email)) errors.push('Please enter a valid email address.');
  if (phone && !isValidPhone(phone)) errors.push('Please enter a valid phone number.');

  return { errors, cleaned: { firstName, lastName, email, phone } };
}


// exports.showProfile — GET /profile just loads the user's profile, also member info and shows the page.
exports.showProfile = async (req, res, next) => {
  try {
    if (!req.session.user) return res.redirect('/auth/login');

    const user = await User.findById(req.session.user._id).populate('member');
    if (!user) return res.redirect('/auth/login');

    res.render('profile/profile', {
      title: 'My Profile',
      user,
      member: user.member,
      profileError: null,
      passwordError: null,
      passwordSuccess: null
    });
  } catch (err) {
    console.error('Error loading profile:', err);
    next(err);
  }
};


// exports.updateProfile — POST /profile  updates name, email, phone and the picture
// this part is slightly more advanced because I update both User and Member
exports.updateProfile = async (req, res, next) => {
  try {
    if (!req.session.user) return res.redirect('/auth/login');

    const user = await User.findById(req.session.user._id).populate('member');
    if (!user) return res.redirect('/auth/login');

    const member = user.member;
    const { errors, cleaned } = validateProfileInput(req.body);

    if (errors.length > 0) {
      const memberForView = member
        ? { ...member.toObject(), ...cleaned }
        : null;

      return res.status(400).render('profile/profile', {
        title: 'My Profile',
        user,
        member: memberForView,
        profileError: errors.join(' '),
        passwordError: null,
        passwordSuccess: null
      });
    }

    const { firstName, lastName, email, phone } = cleaned;

    // update Member fields
    if (member) {
      member.firstName = firstName;
      member.lastName = lastName;
      member.phone = phone;
      member.email = email;

      if (req.file) {
        member.photo = '/uploads/' + req.file.filename;
      }

      await member.save();
    }

    // update User email too so login matches
    if (email && email !== user.email) {
      user.email = email;
      await user.save();
    }

    // keep session updated
    req.session.user.email = user.email;

    res.redirect('/profile');
  } catch (err) {
    console.error('Error updating profile:', err);
    next(err);
  }
};


// exports.updatePassword — POST /profile/password lets a logged-in user change their password
// this one uses bcrypt.compare and bcrypt.hash so it was more advanced
exports.updatePassword = async (req, res, next) => {
  try {
    if (!req.session.user) return res.redirect('/auth/login');

    const user = await User.findById(req.session.user._id).populate('member');
    if (!user) return res.redirect('/auth/login');

    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).render('profile/profile', {
        title: 'My Profile',
        user,
        member: user.member,
        profileError: null,
        passwordError: 'All password fields are required.',
        passwordSuccess: null
      });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).render('profile/profile', {
        title: 'My Profile',
        user,
        member: user.member,
        profileError: null,
        passwordError: 'New password must be at least 6 characters long.',
        passwordSuccess: null
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).render('profile/profile', {
        title: 'My Profile',
        user,
        member: user.member,
        profileError: null,
        passwordError: 'New passwords do not match.',
        passwordSuccess: null
      });
    }

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      return res.status(400).render('profile/profile', {
        title: 'My Profile',
        user,
        member: user.member,
        profileError: null,
        passwordError: 'Current password is incorrect.',
        passwordSuccess: null
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.render('profile/profile', {
      title: 'My Profile',
      user,
      member: user.member,
      profileError: null,
      passwordError: null,
      passwordSuccess: 'Password updated successfully.'
    });
  } catch (err) {
    console.error('Error updating password:', err);
    next(err);
  }
};
