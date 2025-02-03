const Event = require('../src/models/Event');
const { createEvent } = require('../src/controllers/eventControllers');

jest.mock('../src/models/Event'); // Mock the entire Event model

describe('Event Controller - createEvent', () => {
  let req, res;

  beforeEach(() => {
    req = { body: { name: 'Concert', date: '15/02/2025', capacity: 100 } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    jest.clearAllMocks(); // Reset mocks before each test

    // Mocking console.error to suppress error logs during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Restore all mocks after each test
  });

  test('should create an event if no event exists on the same date', async () => {
    Event.findOne.mockResolvedValue(null); // No existing event
    Event.prototype.save.mockResolvedValue({ _id: '12345', name: 'Concert' }); // Save event successfully

    await createEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ _id: '12345', message: 'Event created successfully' });
  });

  test('should return error if an event already exists on the same date', async () => {
    Event.findOne.mockResolvedValue({ _id: '54321', name: 'Existing Event' }); // Event already exists

    await createEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'An event already exists on this date' });
  });

  test('should return an error for invalid date format', async () => {
    req.body.date = '15-02-2025'; // Invalid format

    await createEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid date format. Use DD/MM/YYYY' });
  });

  test('should return 500 if event creation fails', async () => {
    Event.findOne.mockResolvedValue(null); // No existing event
    Event.prototype.save.mockRejectedValue(new Error('DB error')); // Simulate DB error

    await createEvent(req, res);

    expect(console.error).toHaveBeenCalledWith('Error creating event:', expect.any(Error)); // Check if console.error was called
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
