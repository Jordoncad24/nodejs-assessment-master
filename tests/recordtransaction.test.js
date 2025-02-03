const Event = require('../src/models/Event');
const TicketTransaction = require('../src/models/TicketTransaction');
const { recordTransaction } = require('../src/controllers/eventControllers');

describe('Event Controller - recordTransaction', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        event: 'event123',
        nTickets: 3,
      },
    };

    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    jest.clearAllMocks(); // Reset mocks before each test
  });

  test('should record a transaction successfully', async () => {
    // Mocking the Event model's findById method to return an event with enough capacity
    jest.spyOn(Event, 'findById').mockResolvedValue({
      _id: 'event123',
      capacity: 5,
      ticketsSold: 2,
      save: jest.fn().mockResolvedValue(),
    });

    // Mocking the TicketTransaction model's save method to resolve successfully
    jest.spyOn(TicketTransaction.prototype, 'save').mockResolvedValue();

    await recordTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Transaction recorded successfully' });
  });

  test('should return an error if required fields are missing', async () => {
    req.body = {}; // No event or nTickets

    await recordTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields: event, nTickets' });
  });

  test('should return an error if event is not found', async () => {
    // Mocking the Event model's findById method to return null (event not found)
    jest.spyOn(Event, 'findById').mockResolvedValue(null);

    await recordTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Event not found' });
  });

  test('should return an error if event is sold out (ticketsSold + requested > capacity)', async () => {
    // Mocking the Event model's findById method to return an event that is sold out
    jest.spyOn(Event, 'findById').mockResolvedValue({
      _id: 'event123',
      capacity: 5,
      ticketsSold: 4,
      save: jest.fn(),
    });

    // Attempting to request 2 more tickets, which exceeds the capacity
    req.body.nTickets = 2;

    await recordTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Event sold out or insufficient tickets available' });
  });

  test('should return 500 if transaction saving fails', async () => {
    // Mocking the Event model's findById method to return an event with available tickets
    jest.spyOn(Event, 'findById').mockResolvedValue({
      _id: 'event123',
      capacity: 5,
      ticketsSold: 2,
      save: jest.fn().mockResolvedValue(),
    });

    // Mocking the TicketTransaction model's save method to reject with an error
    jest.spyOn(TicketTransaction.prototype, 'save').mockRejectedValue(new Error('DB error'));

    await recordTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});