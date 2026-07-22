import { io } from 'socket.io-client';

let socket;

/**
 * Create (or reuse) a socket connection.
 * Server: http://localhost:3001
 */
export function getSocket() {
  if (!socket) {
    socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
  }
  return socket;
}

export function joinRoom({ role, id }) {
  const s = getSocket();
  if (s?.connected) {
    s.emit('join', { role, id });
  } else {
    s.on('connect', () => s.emit('join', { role, id }));
  }
}
