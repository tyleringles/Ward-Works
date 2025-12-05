// Mini short announcement for the ward announcement board on home page

const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const announcementSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    body: {
      type: String,
      required: true,
      trim: true
    },

    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true   //Stucture of Announcment in mongo DB
  }
);

module.exports = mongoose.model('Announcement', announcementSchema);
