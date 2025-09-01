const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: String,
    required: true
  },
  senderRole: {
    type: String,
    enum: ['user', 'lawyer'],
    required: true
  },
    content: {
    type: String,
    required: function () { return !this.files || this.files.length === 0; }
  },
  files: [
    {
      fileUrl: String,
      fileType: String,
      fileName: String,
    }
  ],
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});


MessageSchema.index({ bookingId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', MessageSchema);