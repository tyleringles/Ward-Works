
// This is the main entry file for Ward Works it: 
//  - loads libraries
//  - connects to MongoDB
//  - sets up middleware + routes
//  - starts the web server


// All the libariys used

const express = require('express');    
const mongoose = require('mongoose'); 
const path = require('path');
const bcrypt = require('bcryptjs');


//All the Utility libraries

const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const session = require('express-session');
const axios = require('axios');
const multer = require('multer');

// profile routes live in their own file
const profileRoutes = require('./routes/profile');


require('dotenv').config(); // loads my .env into process.env

// I double check it here so I don't have problems
console.log('MONGO_URI from .env:', process.env.MONGO_URI);

const app = express();




app.use(express.json()); // parse JSON bodies 
app.use(express.urlencoded({ extended: true })); // parse regular form posts
app.use(methodOverride('_method')); // supports ?_method=PUT/DELETE from forms


//This is all my Muller stuff
// store uploaded files on disk in uploads
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    // timestamp in front so filenames stay unique
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    cb(null, timestamp + '-' + file.originalname);
  }
});

// only allow image file types
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false); // ignore all the non-image files
  }
};

//  multer into the app 
app.use(multer({ storage: fileStorage, fileFilter }).single('avatar'));


//The Static files

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev ward works secret',
    resave: false,
    saveUninitialized: false
  })
);

app.use((req, res, next) => {
  res.locals.isAuthenticated = !!req.session.user;
  res.locals.currentUser = req.session.user || null;
  next();
});



app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'views'));

app.use(expressLayouts);

app.set('layout', 'layout'); 



const Member = require('./models/Member');

const User = require('./models/User');

const Event = require('./models/Event');




const memberRoutes = require('./routes/members');

const attendanceRoutes = require('./routes/attendance');

const authRoutes = require('./routes/auth');
const callingRoutes = require('./routes/callings');

const adminRoutes = require('./routes/admin');
const eventRoutes = require('./routes/events');

const programRoutes = require('./routes/programs');
const churchRoutes = require('./routes/church');


app.use('/members', memberRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/auth', authRoutes);
app.use('/callings', callingRoutes);
app.use('/admin', adminRoutes);
app.use('/profile', profileRoutes);
app.use('/events', eventRoutes);
app.use('/programs', programRoutes);
app.use(churchRoutes);




// shows scripture of the day the external API + next 3 events
app.get('/', async (req, res) => {
  const SCRIPTURE_REFS = [
    '1 Nephi 3:7',
    'Mosiah 2:17',
    'Alma 32:21',
    'Ether 12:27',
    'Moroni 10:32'
  ];

  let scripture = null;
  let events = [];

  // scripture of the day — this part uses axios (outside package) and an external API 
  try {
    const randomRef =
      SCRIPTURE_REFS[Math.floor(Math.random() * SCRIPTURE_REFS.length)];

    const response = await axios.get('https://api.nephi.org/scriptures/', {
      params: { q: randomRef }
    });

    const data = response.data;

    if (data && Array.isArray(data.scriptures) && data.scriptures.length > 0) {
      const v = data.scriptures[0];
      scripture = {
        reference: v.scripture,
        text: v.text
      };
    }
  } catch (err) {
    console.log('Scripture API error:', err.message);
  }

  // upcoming events (just the next 3 from today)
  try {
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    events = await Event.find({ startDate: { $gte: startOfToday } })
      .sort({ startDate: 1 })
      .limit(3)
      .lean();
  } catch (err) {
    console.log('Home events load error:', err.message);
  }

  res.render('home', {
    title: 'Ward Works — Home',
    scripture,
    events
  });
});

// simple static pages
app.get('/about', (req, res) => {
  res.render('about', { title: 'About Ward Works' });
});

app.get('/help', (req, res) => {
  res.render('help', { title: 'Help & Instructions' });
});


// The church info page

// GET /church-info
app.get('/church-info', async (req, res) => {
  let events = [];

  try {
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    events = await Event.find({ startDate: { $gte: startOfToday } })
      .sort({ startDate: 1 })
      .limit(5)
      .lean();
  } catch (err) {
    console.log('Error loading events for church info:', err.message);
  }

  res.render('church-info', { title: 'Church Info', events });
});



app.get('/members/report', async (req, res) => {
  try {
    const members = await Member.find().lean();
    const totalMembers = members.length;

    const genderCounts = {
      male: 0,
      female: 0,
      other: 0,
      unknown: 0
    };

    members.forEach(m => {
      const g = m.gender || 'unknown';
      if (genderCounts[g] !== undefined) {
        genderCounts[g]++;
      } else {
        genderCounts.unknown++;
      }
    });

    const recentMembers = [...members]
      .sort((a, b) => {
        const da = new Date(a.updatedAt || a.createdAt || 0);
        const db = new Date(b.updatedAt || b.createdAt || 0);
        return db - da;
      })
      .slice(0, 5);

    res.render('members/report', {
      title: 'Member Reports',
      totalMembers,
      genderCounts,
      recentMembers
    });
  } catch (err) {
    console.error('Error loading member report:', err);
    res.status(500).send('Error loading member report');
  }
});


app.get('/seed', async (req, res) => {
  try {
    await Member.deleteMany({});
    await User.deleteMany({});

    const testMember = await Member.create({
      firstName: 'Test',
      lastName: 'Member',
      email: 'test@example.com',
      phone: '555-1234'
    });

    const adminMember = await Member.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@wardworks.test',
      phone: '555-0000'
    });

    const adminPasswordHash = await bcrypt.hash('admin123', 12);

    const adminUser = await User.create({
      email: 'admin@wardworks.test',
      passwordHash: adminPasswordHash,
      role: 'admin',
      member: adminMember._id
    });

    res.send(
      'Seeded test data:<br>' +
        `• Member: ${testMember.firstName} ${testMember.lastName} (${testMember.email})<br>` +
        `• Admin: ${adminMember.firstName} ${adminMember.lastName} (${adminUser.email})<br>` +
        'Use <strong>admin@wardworks.test</strong> with password <strong>admin123</strong> to log in as admin.'
    );
  } catch (err) {
    res.status(500).send(' Seeding error: ' + err.message);
  }
});

// GET /api/members the JSON endpoint with all members (sorted by lastName)

app.get('/api/members', async (req, res) => {
  try {
    const members = await Member.find().sort({ lastName: 1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load members' });
  }
});

// wrapped in the async function so I can use await for mongoose.connect
async function start() {
  try {
    if (!process.env.MONGO_URI) {
      console.error(' MONGO_URI missing. Check your .env file.');
      process.exit(1);
    }

    console.log(' Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log(' Connected to MongoDB');

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(` Ward Works running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

start();
