// Stores church callings for members.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CallingSchema = new Schema(
  {
    
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },

    
    organization: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },

    
    member: {
      type: Schema.Types.ObjectId,
      ref: 'Member'
      
    },

    
    notes: {
      type: String,
      trim: true,
      maxlength: 500
    },

    
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true } 
);//defines structure of calling


module.exports = mongoose.model('Calling', CallingSchema);
