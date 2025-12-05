
// route used to seed the database with test data (for development only)

const express = require('express');
const router = express.Router();
const Member = require('../models/Member');

// GET /seed
// Clears all members (optional) and inserts one test member.
router.get('/', async (req, res) => {
  try {
    // Delete all existing member records (optional, but matches original code)
    await Member.deleteMany({});

    // Insert a test member so you can verify list pages work
    await Member.create({
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      phone: "555-555-5555",
      gender: "unknown"
    });

    res.send("Seed complete: 1 test member created.");
  } catch (err) {
    console.error("Seeding error:", err);
    res.status(500).send("Error seeding: " + err.message);
  }
});

module.exports = router;
