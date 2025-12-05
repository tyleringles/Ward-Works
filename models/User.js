// A login account for WardWorks

const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const UserSchema = new Schema(
  {
    
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,  
      unique: true   
    },

    
    passwordHash: {
      type: String,
      required: true
    },

    
    role: {
      type: String,
      enum: ['member', 'admin'],
      default: 'member'
    },

    
    member: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      default: null
    }
  },
  { timestamps: true } 
);// Defines the structure of a User account


module.exports = mongoose.model('User', UserSchema);
