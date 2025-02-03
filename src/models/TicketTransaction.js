const mongoose = require('mongoose');

const ticketTransactionSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  nTickets: { type: Number, required: true },
  transactionDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('TicketTransaction', ticketTransactionSchema);