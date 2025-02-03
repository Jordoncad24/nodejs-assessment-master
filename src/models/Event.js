const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true, unique: true },
  capacity: { type: Number, required: true },
  costPerTicket: { type: Number, required: true },
  ticketsSold: { type: Number, default: 0 },
});

module.exports = mongoose.model('Event', eventSchema);
