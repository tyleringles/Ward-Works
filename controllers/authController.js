
//   This controller handles everything related to authentication and verification


const bcrypt = require('bcryptjs');        // past learning in class helps compare passwords
const User = require('../models/User');
const Member = require('../models/Member');



// isValidEmail(email)checks that the email is vaild
// used regex witch was not taught in class because while hashs are good for vailidation I found for email speciffically Regex is better due to it's ablit to work with text more effectivily

function isValidEmail(email) {
  if (!email) return false;
  const trimmed = email.trim();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed);
}



// isValidPassword checks if a password is at least a minimum length, used a simple rule making have to be string and 6 charaters long

function isValidPassword(password) {
  return typeof password === 'string' && password.trim().length >= 6;
}



exports.getLogin = (req, res) => {
  res.render('auth/login', {
    title: 'Login',
    errorMessage: null,
    oldInput: {
      email: ''
    }
  });
};



// exports.getSignup in the GET /auth/signup shows the signup (create account) page.

exports.getSignup = (req, res) => {
  res.render('auth/signup', {
    title: 'Create Account',
    errorMessage: null,
    oldInput: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      gender: ''
    }
  });
};


// low key advanced programing was insted of plain text used bcrypt.hash to store encrypted passwords also linking the members seemed hard

exports.postSignup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      gender,
      password,
      confirmPassword
    } = req.body;

    console.log('Signup attempt:', { email });

 
    const trimmedFirst = (firstName || '').trim();
    const trimmedLast = (lastName || '').trim();
    const trimmedEmail = (email || '').trim();
    const trimmedPhone = (phone || '').trim();
    const trimmedGender = (gender || '').trim();

    const oldInput = {
      firstName: trimmedFirst,
      lastName: trimmedLast,
      email: trimmedEmail,
      phone: trimmedPhone,
      gender: trimmedGender
    };

    if (!trimmedFirst || !trimmedLast || !trimmedEmail || !password) {
      return res.status(400).render('auth/signup', {
        title: 'Create Account',
        errorMessage:
          'First name, last name, email, and password are required.',
        oldInput
      });
    }

    if (!isValidEmail(trimmedEmail)) {
      return res.status(400).render('auth/signup', {
        title: 'Create Account',
        errorMessage: 'Please enter a valid email address.',
        oldInput
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).render('auth/signup', {
        title: 'Create Account',
        errorMessage: 'Password must be at least 6 characters long.',
        oldInput
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).render('auth/signup', {
        title: 'Create Account',
        errorMessage: 'Passwords do not match.',
        oldInput
      });
    }


    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(400).render('auth/signup', {
        title: 'Create Account',
        errorMessage: 'That email is already registered.',
        oldInput
      });
    }


    const member = await Member.create({
      firstName: trimmedFirst,
      lastName: trimmedLast,
      email: trimmedEmail,
      phone: trimmedPhone,
      gender: trimmedGender || 'unknown' // default to 'unknown' if not selected
    });

 
    const passwordHash = await bcrypt.hash(password, 12);


    const user = await User.create({
      email: trimmedEmail,
      passwordHash,
      role: 'member',
      member: member._id
    });

    console.log('New user created:', user.email);

  
    req.session.user = {
      _id: user._id.toString(),
      email: user.email,
      role: user.role
    };

    req.session.save(() => {
      res.redirect('/members');
    });
  } catch (err) {
    console.error('Signup error:', err);

    res.status(500).render('auth/signup', {
      title: 'Create Account',
      errorMessage: 'There was a problem creating your account. Try again.',
      oldInput: {
        firstName: (req.body.firstName || '').trim(),
        lastName: (req.body.lastName || '').trim(),
        email: (req.body.email || '').trim(),
        phone: (req.body.phone || '').trim(),
        gender: (req.body.gender || '').trim()
      }
    });
  }
};



// exports.postLogin in route POST /auth/login and it dose the login from subbmission valitades input looks up user and redirects them to correct page

exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const trimmedEmail = (email || '').trim();

    console.log('Login attempt:', trimmedEmail);

    const oldInput = {
      email: trimmedEmail
    };


    if (!trimmedEmail || !password) {
      return res.status(400).render('auth/login', {
        title: 'Login',
        errorMessage: 'Email and password are required.',
        oldInput
      });
    }

    if (!isValidEmail(trimmedEmail)) {
      return res.status(400).render('auth/login', {
        title: 'Login',
        errorMessage: 'Please enter a valid email address.',
        oldInput
      });
    }

    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {

      return res.status(401).render('auth/login', {
        title: 'Login',
        errorMessage: 'Invalid email or password.',
        oldInput
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).render('auth/login', {
        title: 'Login',
        errorMessage: 'Invalid email or password.',
        oldInput
      });
    }

    req.session.user = {
      _id: user._id.toString(),
      email: user.email,
      role: user.role
    };

    req.session.save(() => {
      res.redirect('/members'); 
    });
  } catch (err) {
    console.error('Login error:', err);

    res.status(500).render('auth/login', {
      title: 'Login',
      errorMessage: 'There was a problem logging in. Try again.',
      oldInput: {
        email: (req.body.email || '').trim()
      }
    });
  }
};



// Exports.postLogout in route POST /auth/logout needed to Log the user out dose it by destroying their session

exports.postLogout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};
