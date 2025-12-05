// attendance records for each member for each date 

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define structure of an attendance record
const AttendanceSchema = new Schema(
  {
    
    member: {
      type: Schema.Types.ObjectId,
      ref: 'Member',   // directs from mongose where to refrence from
      required: true
    },

    
    date: {
      type: String,
      required: true
    },

    
    present: {
      type: Boolean,
      default: false
    },

    
    meetingType: {
      type: String,
      enum: ['elder_quorum', 'relief_society', 'sunday_school', 'other'],
      default: 'other'
    },

    
    notes: {
      type: String,
      trim: true
    }
  },
  { timestamps: true } 
);

// Prevent duplicates
AttendanceSchema.index({ member: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
