// jest.setup.js

jest.mock('mongoose', () => {
    const originalMongoose = jest.requireActual('mongoose');
    return {
      ...originalMongoose,
      connect: jest.fn().mockResolvedValue('MongoDB connected'),
      model: jest.fn().mockReturnValue({
        findOne: jest.fn(),
        findById: jest.fn(),
        save: jest.fn().mockResolvedValue(),
      }),
    };
  });
  