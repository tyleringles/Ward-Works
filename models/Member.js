// A member in the ward directory, used for the program, attendance, callings and profile related views

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the structure of a Member document
const MemberSchema = new Schema(
  {
    
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50
    },

    
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50
    },

    
    email: {
      type: String,
      trim: true,
      lowercase: true
      
    },

    phone: {
      type: String,
      trim: true
    },

    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'unknown'],
      default: 'unknown'
    },
    photo: {
      type: String,
      trim: true
    }
  },
  { timestamps: true } 
); //defines member doc structure 

module.exports = mongoose.model('Member', MemberSchema);
