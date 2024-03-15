const net = require('net');
const path = require("path");
const http = require("http");
const fs = require("fs");
const { formatMessage } = require("./utils/message"); 
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require("./utils/user"); 

const botName = "Real-Time Chat Application";
const PORT = 3000;

const clients = {};

// Broadcast message to all clients except the sender
const broadcast = (sender, message) => {
  Object.keys(clients).forEach(clientId => {
    const client = clients[clientId];
    if (client !== sender) {
      client.write(message);
    }
  });
};

const server = net.createServer((socket) => {
  const clientId = `${socket.remoteAddress}:${socket.remotePort}`;
  const user = userJoin(clientId, "Anonymous", "General");
  clients[clientId] = socket;

  socket.on('data', (data) => {
    const message = `${user.username} - ${data}`;
    console.log(message);
    broadcast(socket, message);
  });

  socket.on('end', () => {
    const user = getCurrentUser(clientId);
    if (user) {
      userLeave(clientId);
      broadcast(socket, formatMessage(botName, `${user.username} has left the chat`));
      broadcast(socket, {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
  
  // Moved the 'data' event listener inside the 'net.createServer()' callback function
  // On receiving data from a client
  socket.on('data', (data) => {
    const message = data.toString();
    console.log(message);
    broadcast(socket, message);
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Serve static files
const staticServer = http.createServer((req, res) => {
  const filePath = path.join(__dirname, "client", req.url === "/" ? "index.html" : req.url);
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(fs.readFileSync(filePath));
});

staticServer.listen(8080, () => console.log(`Static server running on port 8080`));
