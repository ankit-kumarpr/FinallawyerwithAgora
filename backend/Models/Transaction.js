const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: 'User'
  },
  lawyerId: {
    type: String,
    ref: 'Lawyer'
  },
  amount: Number,
  type: {
    type: String,
    enum: ['consultation', 'withdrawal'],
    default: 'consultation'
  },
  status: {
    type: String,
    enum: ['success', 'pending', 'failed'],
    default: 'pending'
  },
  paymentId: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
