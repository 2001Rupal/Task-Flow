let _io = null;

const init = (io) => { _io = io; };

const emitToProject = (projectId, event, data) => {
  if (_io) _io.to(`project:${projectId}`).emit(event, data);
};

const emitToUser = (userId, event, data) => {
  if (_io) _io.to(`user:${userId}`).emit(event, data);
};

module.exports = { init, emitToProject, emitToUser };
