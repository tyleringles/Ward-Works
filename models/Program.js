// This modle is defining my Sacrament program and what it should be

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProgramSchema = new Schema(
  {
    // Title shown at the top of the program
    title: {
      type: String,
      default: 'YSA 15th Ward'
    },

    // Date of the meeting in YYYY-MM-DD 
    date: {
      type: String,
      required: true,
      trim: true
    },

    // Leadership roles for the meeting and music

    presiding: { type: Schema.Types.ObjectId, ref: 'Member' },
    conducting: { type: Schema.Types.ObjectId, ref: 'Member' },
    chorister: { type: Schema.Types.ObjectId, ref: 'Member' },
    organist: { type: Schema.Types.ObjectId, ref: 'Member' },

    // Hymns for the meeting 
    
    openingHymn: {
      number: { type: String, trim: true },
      title: { type: String, trim: true }
    },
    sacramentHymn: {
      number: { type: String, trim: true },
      title: { type: String, trim: true }
    },
    intermediateHymn: {
      number: { type: String, trim: true },
      title: { type: String, trim: true }
    },
    closingHymn: {
      number: { type: String, trim: true },
      title: { type: String, trim: true }
    },

    // Members giving prayers, used schema to make dropdown
    openingPrayer: { type: Schema.Types.ObjectId, ref: 'Member' },
    closingPrayer: { type: Schema.Types.ObjectId, ref: 'Member' },

    // did the same as prayers but with speakers
    speakers: [
      {
        member: { type: Schema.Types.ObjectId, ref: 'Member' },
        otherName: { type: String, trim: true }, 
        topic: { type: String, trim: true },
        order: { type: Number }  
      }
    ],

    // General announcements and business items.
    announcements: { type: String, trim: true },
    stakeBusiness: { type: String, trim: true },
    wardBusiness: { type: String, trim: true },

    // Option for Fast Sunday testimony meetings
    includeBearingOfTestimonies: {
      type: Boolean,
      default: false
    },


    // Scond hour option
    secondHourType: {
      type: String,
      default: 'Sunday School',
      trim: true
    },

    // makes a text box if other is picked, somthing new I learned
    secondHourOtherText: { type: String, trim: true }
  },

  // time stamp to be safe
  { timestamps: true }
);

module.exports = mongoose.model('Program', ProgramSchema);
