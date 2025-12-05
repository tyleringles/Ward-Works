//   This controller handles everything related to attendance

const mongoose = require('mongoose');
const Attendance = require('../models/Attendance'); // Mongoose model for attendance records
const Member = require('../models/Member');         // Mongoose model for members

//this is a list of the allowed meeting types, somthing that was diffcult was making 'other' here at first I though I could create the text box in the controller
const ALLOWED_MEETING_TYPES = [
  'elder_quorum',
  'relief_society',
  'sunday_school',
  'other'
];



// HELPER FUNCTION: getSelectedDate(queryDate)
// the function getSelectedDate make sure the string is in the proper format and if the date isn't or left blank then it defaluts to todays date
// Using regex in validating date format to make it all the same was a diffculte thing for me and felt beyon my capablititys 

function getSelectedDate(queryDate) {
  if (queryDate && /^\d{4}-\d{2}-\d{2}$/.test(queryDate)) {
    return queryDate;
  }

  const now = new Date();
  const y = now.getFullYear();

  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');

  
  return `${y}-${m}-${d}`;
}



//exports.showTake displays the "Take Attendance" page for leaders and admins in the route GET /attendance
// Combining members and attendance was much more advanced have to have some help for that

exports.showTake = async (req, res) => {
  try {
    const selectedDate = getSelectedDate(req.query.date);

    const sortParam = req.query.sort || 'last';


    const allowedSorts = ['last', 'first', 'gender'];
    const sort = allowedSorts.includes(sortParam) ? sortParam : 'last';


    let sortSpec;
    if (sort === 'gender') {

      sortSpec = { gender: 1, lastName: 1, firstName: 1 };
    } else if (sort === 'first') {

      sortSpec = { firstName: 1, lastName: 1 };
    } else {

      sortSpec = { lastName: 1, firstName: 1 };
    }

    const members = await Member.find().sort(sortSpec).lean();
    const records = await Attendance.find({ date: selectedDate }).lean();

    const byMemberId = new Map();
    records.forEach((rec) => {
      byMemberId.set(String(rec.member), rec);
    });

    res.render('attendance/take', {
      title: 'Take Attendance',
      selectedDate,
      members,
      existing: byMemberId,
      sort,
      error: null
    });
  } catch (err) {
    console.error('Error loading attendance page:', err);

    res.status(500).render('attendance/take', {
      title: 'Take Attendance',
      selectedDate: getSelectedDate(req.query?.date),
      members: [],
      existing: new Map(),
      sort: 'last',
      error: 'There was a problem loading the attendance page. Please try again.'
    });
  }
};



// CONTROLLER: exports.save saves attendance for a given date from the leader/admin "Take Attendance" page.
// there was some more advanced handling in this part cause I used dynamic form field names

exports.save = async (req, res) => {
  try {
    const date = getSelectedDate(req.body.date);

    let memberIds = req.body.memberIds;

    if (!memberIds) {

      return res.redirect(`/attendance?date=${encodeURIComponent(date)}`);
    }

    if (!Array.isArray(memberIds)) {
      memberIds = [memberIds];
    }

    const validMemberIds = memberIds.filter((id) => mongoose.isValidObjectId(id));

    if (validMemberIds.length === 0) {
      console.warn('No valid member IDs submitted for attendance:', memberIds);
      return res
        .status(400)
        .send('No valid members were submitted for attendance.');
    }

 
    for (const memberId of validMemberIds) {

      const present = !!req.body[`present_${memberId}`];

      let notes = (req.body[`notes_${memberId}`] || '').trim();

      if (notes.length > 500) {
        notes = notes.slice(0, 500);
      }


      await Attendance.findOneAndUpdate(
        { member: memberId, date },
        { present, notes },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }

    res.redirect(`/attendance?date=${encodeURIComponent(date)}`);
  } catch (err) {
    console.error('Error saving attendance:', err);
    res.status(500).send('Error saving attendance.');
  }
};



// exports.showCheckin shows the self check-in page for whatever user is logged in
// This is were a member can record their own attendance for today.

exports.showCheckin = async (req, res) => {
  try {
    const selectedDate = getSelectedDate();

    const user = req.session.user;

    if (!user || !user.member) {
      return res
        .status(403)
        .send('You must be linked to a member to check in.');
    }

    if (!mongoose.isValidObjectId(user.member)) {
      console.warn('Invalid member ID on session for check-in:', user.member);
      return res.status(400).send('Invalid member link on your account.');
    }

    const member = await Member.findById(user.member).lean();
    if (!member) {
      return res.status(404).send('Linked member not found.');
    }

    const record =
      (await Attendance.findOne({ member: member._id, date: selectedDate }).lean()) ||
      null;

    res.render('attendance/checkin', {
      title: 'My Attendance Check-In',
      selectedDate,
      member,
      record, 
      error: null
    });
  } catch (err) {
    console.error('Error loading check-in page:', err);
    res.status(500).send('Error loading check-in page.');
  }
};



// exports.saveCheckin saves the users self check-in for today

exports.saveCheckin = async (req, res) => {
  try {
    const date = getSelectedDate();

    const user = req.session.user;

    if (!user || !user.member) {
      return res
        .status(403)
        .send('You must be linked to a member to check in.');
    }

    if (!mongoose.isValidObjectId(user.member)) {
      console.warn(
        'Invalid member ID on session for self check-in:',
        user.member
      );
      return res.status(400).send('Invalid member link on your account.');
    }

    const member = await Member.findById(user.member);
    if (!member) {
      return res.status(404).send('Linked member not found.');
    }

    const meetingType = (req.body.meetingType || 'other').trim();

  
    const finalMeetingType = ALLOWED_MEETING_TYPES.includes(meetingType)
      ? meetingType
      : 'other';

    let notes = (req.body.notes || '').trim();
    if (notes.length > 500) {
      notes = notes.slice(0, 500);
    }

    const present = true;

    await Attendance.findOneAndUpdate(
      { member: member._id, date },
      { present, meetingType: finalMeetingType, notes },
      { upsert: true, setDefaultsOnInsert: true }
    );

    res.redirect('/attendance/checkin');
  } catch (err) {
    console.error('Error saving self check-in:', err);
    res.status(500).send('Error saving self check-in.');
  }
};

// CONTROLLER: exports.history displays the overall attendance history list for ALL records.

exports.history = async (req, res) => {
  try {
    const records = await Attendance.find()
      .populate('member')                     // include full member data
      .sort({ date: -1, 'member.lastName': 1 }) // newest dates first, then by member last name
      .lean();

    res.render('attendance/history', {
      title: 'Attendance History',
      records,
      error: null
    });
  } catch (err) {
    console.error('Error loading attendance history:', err);
    res.status(500).send('Error loading attendance history.');
  }
};



// CONTROLLER: exports.memberHistory shows attendance history for a SINGLE member.
exports.memberHistory = async (req, res) => {
  try {
    const memberId = req.params.id;

    if (!mongoose.isValidObjectId(memberId)) {
      console.warn('Invalid member ID for attendance history:', memberId);
      return res.status(400).send('Invalid member ID.');
    }

    const member = await Member.findById(memberId).lean();
    if (!member) {
      return res.status(404).send('Member not found.');
    }

    const records = await Attendance.find({ member: memberId })
      .sort({ date: -1 })
      .lean();

    res.render('attendance/memberHistory', {
      title: `Attendance — ${member.firstName} ${member.lastName}`,
      member,
      records,
      error: null
    });
  } catch (err) {
    console.error('Error loading member attendance history:', err);
    res.status(500).send('Error loading member attendance history.');
  }
};
