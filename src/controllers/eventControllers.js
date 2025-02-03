const Event = require('../models/Event');
const TicketTransaction = require('../models/TicketTransaction');

const moment = require('moment');

const createEvent = async (req, res) => {
  try {
    const { name, date, capacity, costPerTicket } = req.body;

    console.log('Received payload:', req.body); // Debugging

    // Ensure date is in correct format
    const eventDate = moment(date, "DD/MM/YYYY", true);
    
    if (!eventDate.isValid()) {
      return res.status(400).json({ error: 'Invalid date format. Use DD/MM/YYYY' });
    }

    // Ensure costPerTicket is a positive value
    if (costPerTicket <= 0) {
      return res.status(400).json({ error: 'Cost per ticket must be a positive number' });
    }

    // Convert to MongoDB-friendly format
    const formattedDate = eventDate.toISOString().split("T")[0]; // YYYY-MM-DD

    // Check for an existing event
    const existingEvent = await Event.findOne({ date: formattedDate });

    if (existingEvent) {
      return res.status(400).json({ error: 'An event already exists on this date' });
    }

    // Create a new event
    const newEvent = new Event({ name, date: formattedDate, capacity, costPerTicket });

    const savedEvent = await newEvent.save();
    console.log('Saved event:', savedEvent);

    return res.status(201).json({ _id: savedEvent._id, message: 'Event created successfully' });
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

  
  const recordTransaction = async (req, res) => {
    try {
      const { event, nTickets } = req.body;
  
      if (!event || !nTickets) {
        return res.status(400).json({ error: 'Missing required fields: event, nTickets' });
      }
  
      // Find the event by ID
      const existingEvent = await Event.findById(event);
      if (!existingEvent) {
        return res.status(400).json({ error: 'Event not found' });
      }
  
      // Check if event is sold out (ticketsSold + nTickets requested > capacity)
      if (existingEvent.ticketsSold + nTickets > existingEvent.capacity) {
        return res.status(400).json({ error: 'Event sold out or insufficient tickets available' });
      }
  
      // Proceed to create the transaction
      existingEvent.ticketsSold += nTickets; // Update the tickets sold
      await existingEvent.save();
  
      // Create a new transaction record
      const transaction = new TicketTransaction({
        event,
        nTickets,
        transactionDate: new Date(),
      });
  
      await transaction.save();
  
      return res.status(201).json({ message: 'Transaction recorded successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  const getStats = async (req, res) => {
    try {
      const endDate = moment().endOf('month');
      const startDate = moment().subtract(11, 'months').startOf('month');
  
      const events = await Event.find({
        date: { $gte: startDate.format('YYYY-MM-DD'), $lte: endDate.format('YYYY-MM-DD') }
      });
  
      const transactions = await TicketTransaction.find({
        transactionDate: { $gte: startDate.toDate(), $lte: endDate.toDate() }
      });
  
      const stats = [];
  
      for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
        const currentMonth = moment().subtract(monthOffset, 'months');
        const currentMonthStart = currentMonth.startOf('month');
        const currentMonthEnd = currentMonth.endOf('month');
  
        const monthlyEvents = events.filter(event =>
          moment(event.date).isBetween(currentMonthStart, currentMonthEnd, null, '[]')
        );
  
        const monthlyTransactions = transactions.filter(transaction =>
          moment(transaction.transactionDate).isBetween(currentMonthStart, currentMonthEnd, null, '[]')
        );
  
        let revenue = 0;
        let totalTicketsSold = 0;
  
        monthlyEvents.forEach(event => {
          const eventTransactions = monthlyTransactions.filter(transaction => transaction.event.toString() === event._id.toString());
  
          eventTransactions.forEach(transaction => {
            revenue += event.costPerTicket * transaction.nTickets;
            totalTicketsSold += transaction.nTickets;
          });
        });
  
        const nEvents = monthlyEvents.length;
        const averageTicketsSold = nEvents > 0 ? totalTicketsSold / nEvents : 0;
  
        stats.push({
          year: currentMonth.year(),
          month: currentMonth.month() + 1,
          revenue,
          nEvents,
          averageTicketsSold
        });
      }
  
      return res.status(200).json(stats);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  module.exports = { createEvent, recordTransaction, getStats };
  