const moment = require('moment');
const { getStats } = require('../src/controllers/eventControllers');
const Event = require('../src/models/Event');
const TicketTransaction = require('../src/models/TicketTransaction'); 

jest.mock('moment', () => {
  const actualMoment = jest.requireActual('moment');
  return (...args) => actualMoment(...args).set('date', 1).set('month', 0);  // Fix to January 1st, 2025
});

jest.mock('../src/models/Event'); // Mocking Event model
jest.mock('../src/models/TicketTransaction'); // Mocking TicketTransaction model

describe('getStats function', () => {
    it('should return the correct stats for the last 12 months', async () => {
      // Mock data for events and transactions
      const sampleEvents = [
        { _id: '1', date: moment().subtract(1, 'month').format('YYYY-MM-DD'), costPerTicket: 20 },
        { _id: '2', date: moment().subtract(2, 'months').format('YYYY-MM-DD'), costPerTicket: 30 },
      ];
  
      const sampleTransactions = [
        { event: '1', nTickets: 5, transactionDate: moment().subtract(1, 'month').toDate() },
        { event: '1', nTickets: 10, transactionDate: moment().subtract(1, 'month').toDate() },
        { event: '2', nTickets: 3, transactionDate: moment().subtract(2, 'months').toDate() },
      ];
  
      // Mock the Event and TicketTransaction model methods
      Event.find.mockResolvedValue(sampleEvents);  // Mocking Event.find
      TicketTransaction.find.mockResolvedValue(sampleTransactions);  // Mocking TicketTransaction.find
  
      // Mock the response object for res.json and res.status
      const res = {
        status: jest.fn().mockReturnThis(),  // Mock status and return the res object for chaining
        json: jest.fn(),  // Mock json to track the response
      };
  
      // Mock the request object (req) as needed, here we're assuming no specific data is required
      const req = {};
  
      // Call the getStats function
      await getStats(req, res);
  
      // Calculate the expected stats array for the last 12 months
      const expectedStats = Array.from({ length: 12 }, (_, i) => {
        const month = moment().subtract(i, 'months').month() + 1;  // Adjust for 0-based month
        const year = moment().subtract(i, 'months').year();
        const eventsInMonth = sampleEvents.filter(e => moment(e.date).month() + 1 === month && moment(e.date).year() === year);
        const transactions = sampleTransactions.filter(t => moment(t.transactionDate).month() + 1 === month && moment(t.transactionDate).year() === year);
        
        const revenue = transactions.reduce((sum, t) => {
          const eventDetails = sampleEvents.find(e => e._id === t.event);
          return sum + (t.nTickets * (eventDetails ? eventDetails.costPerTicket : 0));
        }, 0);
  
        const totalTicketsSold = transactions.reduce((sum, t) => sum + t.nTickets, 0);
        const numEvents = eventsInMonth.length;
        const avgTicketsSold = numEvents > 0 ? totalTicketsSold / numEvents : 0;
        
        return {
          year,
          month,
          revenue,
          nEvents: numEvents,
          averageTicketsSold: avgTicketsSold,
        };
      });
  
      // Check if the response was sent with the expected stats
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining(expectedStats));
    });
  });

  describe('getStats function - Edge Cases', () => {
  
    it('should return correct stats for an empty event list', async () => {
      // No events and no transactions
      Event.find.mockResolvedValue([]);
      TicketTransaction.find.mockResolvedValue([]);
  
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
  
      const req = {};
  
      await getStats(req, res);
  
      const expectedStats = Array.from({ length: 12 }, (_, i) => ({
        year: moment().subtract(i, 'months').year(),
        month: moment().subtract(i, 'months').month() + 1,
        revenue: 0,
        nEvents: 0,
        averageTicketsSold: 0,
      }));
  
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining(expectedStats));
    });
  
    it('should return correct stats for events with no transactions', async () => {
      const sampleEvents = [
        { _id: '1', date: moment().subtract(1, 'month').format('YYYY-MM-DD'), costPerTicket: 20 },
        { _id: '2', date: moment().subtract(2, 'months').format('YYYY-MM-DD'), costPerTicket: 30 },
      ];
  
      Event.find.mockResolvedValue(sampleEvents);
      TicketTransaction.find.mockResolvedValue([]);
  
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
  
      const req = {};
  
      await getStats(req, res);
  
      const expectedStats = Array.from({ length: 12 }, (_, i) => {
        const month = moment().subtract(i, 'months').month() + 1;
        const year = moment().subtract(i, 'months').year();
        const eventsInMonth = sampleEvents.filter(e => moment(e.date).month() + 1 === month && moment(e.date).year() === year);
  
        return {
          year,
          month,
          revenue: 0,
          nEvents: eventsInMonth.length,
          averageTicketsSold: 0,
        };
      });
  
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining(expectedStats));
    });
  
    it('should ignore transactions with no matching event', async () => {
      const sampleEvents = [
        { _id: '1', date: moment().subtract(1, 'month').format('YYYY-MM-DD'), costPerTicket: 20 },
      ];
  
      const sampleTransactions = [
        { event: 'nonexistent', nTickets: 5, transactionDate: moment().subtract(1, 'month').toDate() },  // Invalid event
      ];
  
      Event.find.mockResolvedValue(sampleEvents);
      TicketTransaction.find.mockResolvedValue(sampleTransactions);
  
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
  
      const req = {};
  
      await getStats(req, res);
  
      const expectedStats = Array.from({ length: 12 }, (_, i) => {
        const month = moment().subtract(i, 'months').month() + 1;
        const year = moment().subtract(i, 'months').year();
        const eventsInMonth = sampleEvents.filter(e => moment(e.date).month() + 1 === month && moment(e.date).year() === year);
  
        return {
          year,
          month,
          revenue: 0,
          nEvents: eventsInMonth.length,
          averageTicketsSold: 0,
        };
      });
  
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining(expectedStats));
    });
  
    it('should correctly compute stats for a single event and transaction', async () => {
      const sampleEvents = [
        { _id: '1', date: moment().subtract(1, 'month').format('YYYY-MM-DD'), costPerTicket: 20 },
      ];
  
      const sampleTransactions = [
        { event: '1', nTickets: 5, transactionDate: moment().subtract(1, 'month').toDate() },
      ];
  
      Event.find.mockResolvedValue(sampleEvents);
      TicketTransaction.find.mockResolvedValue(sampleTransactions);
  
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
  
      const req = {};
  
      await getStats(req, res);
  
      const expectedStats = Array.from({ length: 12 }, (_, i) => {
        const month = moment().subtract(i, 'months').month() + 1;
        const year = moment().subtract(i, 'months').year();
        const eventsInMonth = sampleEvents.filter(e => moment(e.date).month() + 1 === month && moment(e.date).year() === year);
        const transactions = sampleTransactions.filter(t => moment(t.transactionDate).month() + 1 === month && moment(t.transactionDate).year() === year);
  
        const revenue = transactions.reduce((sum, t) => sum + (t.nTickets * (sampleEvents.find(e => e._id === t.event).costPerTicket)), 0);
        const totalTicketsSold = transactions.reduce((sum, t) => sum + t.nTickets, 0);
        const numEvents = eventsInMonth.length;
        const avgTicketsSold = numEvents > 0 ? totalTicketsSold / numEvents : 0;
  
        return {
          year,
          month,
          revenue,
          nEvents: numEvents,
          averageTicketsSold: avgTicketsSold,
        };
      });
  
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining(expectedStats));
    });
  
    it('should return empty stats for empty events and transactions arrays', async () => {
      Event.find.mockResolvedValue([]);
      TicketTransaction.find.mockResolvedValue([]);
  
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
  
      const req = {};
  
      await getStats(req, res);
  
      const expectedStats = Array.from({ length: 12 }, (_, i) => ({
        year: moment().subtract(i, 'months').year(),
        month: moment().subtract(i, 'months').month() + 1,
        revenue: 0,
        nEvents: 0,
        averageTicketsSold: 0,
      }));
  
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining(expectedStats));
    });
  
    it('should not include future events in stats', async () => {
      const sampleEvents = [
        { _id: '1', date: moment().add(1, 'month').format('YYYY-MM-DD'), costPerTicket: 20 },  // Future event
      ];
  
      const sampleTransactions = [
        { event: '1', nTickets: 5, transactionDate: moment().add(1, 'month').toDate() },  // Future transaction
      ];
  
      Event.find.mockResolvedValue(sampleEvents);
      TicketTransaction.find.mockResolvedValue(sampleTransactions);
  
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
  
      const req = {};
  
      await getStats(req, res);
  
      const expectedStats = Array.from({ length: 12 }, (_, i) => ({
        year: moment().subtract(i, 'months').year(),
        month: moment().subtract(i, 'months').month() + 1,
        revenue: 0,
        nEvents: 0,
        averageTicketsSold: 0,
      }));
  
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining(expectedStats));
    });
  });
  
  