const express = require('express');
const app = express();

const server = require('http').Server(app);
const io = require('socket.io')(server);

server.listen(5000, () => {
    console.log("Listening to port 5000");
})

// App middleware
app.use(express.static('../client'));


// IO events
io.on('connection', (socket) => {
    console.log(socket.id);
    socket.emit('User-connected', {
        instance: socket.id
    })
})