const express = require('express');
const app = express();

const server = require('http').Server(app);
const io = require('socket.io')(server);

server.listen(8000, () => {
    console.log("Listening to port 8000");
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