const express = require('express');
const app = express();

const server = require('http').Server(app);
const io = require('socket.io')(server);

const crypto = require('crypto');

server.listen(8000, () => {
  console.log('Listening to port 8000');
});

// App middleware
app.use(express.static('../client'));

// Global variables

// --- Turns counter
let turns = 0;

// --- Wining coditions array
let winConditions = [7, 56, 448, 73, 146, 292, 273, 84];

// IO events
io.on('connection', (socket) => {
  console.log(socket.id);
  socket.emit('User-connected', {
    instance: socket.id,
  });

  // On connection global variables
  // game object
  // player1 object
  // player2 object

  socket.on('createGame', (data, fn) => {
    let player = data.Player;
    let game = data.Game;

    gameid = `Game-${game.gameid}`;
    socket.join(gameid, (err) => {
      if (err) {
        console.log(`Unable to create a room, error: ${err}`);
        fn({
          status: false,
          message: err,
        });
      } else {
        io.sockets.adapter.rooms[gameid].player1 = player;
        console.log(`Create and joined room ${gameid}, Clients:`);
        console.log(io.sockets.adapter.rooms[gameid].sockets);
        console.log(`Player 1:`);
        console.log(io.sockets.adapter.rooms[gameid].player1);
        io.sockets.in(gameid).emit('gameCreated', `You are in: ${gameid}`);
        fn({
          status: true,
        });
      }
    });
  });

  socket.on('joinGame', (data, fn) => {
    let player = data.Player;
    let game = data.Game;

    gameid = `Game-${game.gameid.toLowerCase()}`;

    // Room validation

    // Room is unavailable
    if (typeof io.sockets.adapter.rooms[gameid] === 'undefined') {
      console.log(`${gameid} room doesnt exist`);
      fn({
        status: false,
        message: `${gameid} room doesnt exist`,
      });
    } else {
      //Game is available and not full
      if (io.sockets.adapter.rooms[gameid].length < 2) {
        socket.join(gameid, (err) => {
          if (err) {
            console.log(`Couldn't join, Error ${err}`);
            fn({
              status: false,
              message: err,
            });
          } else {
            _gameid = gameid;
            io.sockets.adapter.rooms[gameid].player2 = player;
            console.log(`Joined room ${gameid}, Clients:`);
            console.log(io.sockets.adapter.rooms[gameid].sockets);
            console.log(`Player 2`);
            console.log(io.sockets.adapter.rooms[gameid].player2);
            io.to(player.instanceid).emit(
              'gameCreated',
              `You are in: ${gameid}`
            );
            fn({
              status: true,
              gameid: gameid,
              marker: io.sockets.adapter.rooms[gameid].player1.marker === 'X' ?
                'O' :
                'X',
            });
          }
        });
        //Game is available but full
      } else {
        console.log(`${gameid} room is full`);
        fn({
          status: false,
          message: `${gameid} room is full`,
        });
      }
    }
  });

  socket.on('startGame', (data, fn) => {
    let gameid = data;
    let player1 = io.sockets.adapter.rooms[gameid].player1;
    let player2 = io.sockets.adapter.rooms[gameid].player2;

    console.log(`Game started with 2 players`);
    console.log(`Player 1: `);
    console.log(player1.instanceid);
    console.log(`================`);
    console.log(`Player 2: `);
    console.log(player2.instanceid);

    io.to(player1.instanceid).emit('gameStarted', gameid);
  });

  socket.on('turnPlayed', (data) => {
    console.log(data.tilesPlayed);
    let tiles = data.tilesPlayed;
    let moves = data.moves;
    let lastMove = moves[moves.length - 1];

    // Player 1
    if (socket.id === io.sockets.adapter.rooms[gameid].player1.instanceid) {
      turns++;
      // Check if draw

      io.sockets.adapter.rooms[gameid].player1.moves.push(lastMove);
      io.sockets.adapter.rooms[gameid].player1.tilesPlayed = tiles;
      console.log('Player 1 tile IDs: ');
      console.log(io.sockets.adapter.rooms[gameid].player1.moves);
      console.log('Player 1 tiles played: ');
      console.log(io.sockets.adapter.rooms[gameid].player1.tilesPlayed);
      console.log(`Current turn counter: ${turns}`);
      console.log('==================================');

      // Check if player 1 has won
      console.log('Checking Player 1 win condition:');
      winConditions.forEach((winPosition) => {
        console.log(
          `Condition: ${winPosition}. Tiles played: ${io.sockets.adapter.rooms[gameid].player1.tilesPlayed}`
        );
        if (
          (winPosition &
            io.sockets.adapter.rooms[gameid].player1.tilesPlayed) ==
          winPosition
        ) {
          console.log('Player 1 won!');
        }
      });
    }
    // Player 2
    else {
      turns++;
      // Check if draw

      io.sockets.adapter.rooms[gameid].player2.moves.push(lastMove);
      io.sockets.adapter.rooms[gameid].player2.tilesPlayed = tiles;
      console.log('Player 2 tile IDs: ');
      console.log(io.sockets.adapter.rooms[gameid].player2.moves);
      console.log('Player 2 tiles played: ');
      console.log(io.sockets.adapter.rooms[gameid].player2.tilesPlayed);
      console.log(`Current turn counter: ${turns}`);
      console.log('==================================');

      // Check if player 2 has won
      console.log('Checking Player 2 win condition:');
      winConditions.forEach((winPosition) => {
        console.log(
          `Condition: ${winPosition}. Tiles played: ${io.sockets.adapter.rooms[gameid].player2.tilesPlayed}`
        );
        if (
          (winPosition &
            io.sockets.adapter.rooms[gameid].player2.tilesPlayed) ==
          winPosition
        ) {
          console.log('Player 2 won!');
        }
      });
    }

    socket.to(gameid).emit('yourTurn', moves[moves.length - 1]);
  });

  socket.on('generateID', (data, fn) => {
    crypto.randomBytes(3, (err, buf) => {
      if (err) {
        console.log('cant generate an ID: ', err.message);
        fn({
          status: false,
          message: err.message,
        });
      }

      fn({
        status: true,
        id: buf.toString('hex'),
      });
    });
  });

  socket.on('list', (data) => {
    io.sockets.in(data).clients((err, cli) => {
      if (err) console.log(err);

      console.log(cli);
      socket.emit('clients', cli);
    });
  });

  socket.on('currentTurn', (data, fn) => {
    gameid = `Game-${data.gameid.toLowerCase()}`;
    console.log(io.sockets.adapter.rooms[gameid].currentTurn);

    fn({
      status: true,
      currentTurn: io.sockets.adapter.rooms[gameid].currentTurn,
    });
  });

  //
  //
}); // End of connection