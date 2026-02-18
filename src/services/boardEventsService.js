const boardEventsRepository = require('../models/boardEventsRepository');

async function listBoardEvents(params) {
  return boardEventsRepository.list(params);
}

module.exports = { listBoardEvents };
