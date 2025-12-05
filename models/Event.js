
// Represents a calendar event (fhe, church,ward event, etc.).
// Used on the /events calendar and in the admin event list.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EventSchema = new Schema(
  {

    title: {
      type: String,
      required: true,
      trim: true
    },

    
    description: {
      type: String,
      trim: true
    },

    
    location: {
      type: String,
      trim: true
    },

    
    startDate: {
      type: Date,
      required: true
    },

    
    startTime: {
      type: String,
      trim: true
    },

    
    recurrence: {
      type: String,
      enum: ['none', 'weekly', 'monthly'],
      default: 'none'
    }
  },
  { timestamps: true } 
);//structure of event doc


module.exports = mongoose.model('Event', EventSchema);
