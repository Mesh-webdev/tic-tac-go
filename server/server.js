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

/*     273                 84
 *        \               /
 *          1 |   2 |   4  = 7
 *       -----+-----+-----
 *          8 |  16 |  32  = 56
 *       -----+-----+-----
 *         64 | 128 | 256  = 448
 *       =================
 *         73   146   292
 */

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

        // Attach the bothReady value to the room,
        //bothReady is for checking whether 2 players
        //want to restart the game or not
        io.sockets.adapter.rooms[gameid].bothReady = 0;

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
                'O' : 'X',
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

    // Set turn counter to the room
    io.sockets.adapter.rooms[gameid].turnCounter = 0;

    console.log(`Game started with 2 players`);
    console.log(`Player 1: `);
    console.log(player1.instanceid);
    console.log(`================`);
    console.log(`Player 2: `);
    console.log(player2.instanceid);

    io.in(gameid).emit('setPlayerInfo', {
      player1,
      player2,
    });

    io.in(gameid).emit('startCounter');
    socket.on('counterFinished', () => {
      io.to(player1.instanceid).emit('gameStarted');
      io.to(player2.instanceid).emit('updateBoardTitle');
    });
  });

  socket.on('turnPlayed', (data) => {
    let tiles = data.tilesPlayed;
    let moves = data.moves;
    let lastMove = moves[moves.length - 1];

    // Player 1
    if (socket.id === io.sockets.adapter.rooms[gameid].player1.instanceid) {
      io.sockets.adapter.rooms[gameid].turnCounter++;

      io.sockets.adapter.rooms[gameid].player1.moves.push(lastMove);
      io.sockets.adapter.rooms[gameid].player1.tilesPlayed = tiles;
      console.log('Player 1 tile IDs: ');
      console.log(io.sockets.adapter.rooms[gameid].player1.moves);
      console.log('Player 1 tiles played: ');
      console.log(io.sockets.adapter.rooms[gameid].player1.tilesPlayed);
      console.log(
        `Current turn counter: ${io.sockets.adapter.rooms[gameid].turnCounter}`
      );
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

          // Emit win
          socket.emit('Winner', 'You won 🔥, Congratulations!');
          // Emit lose
          socket.broadcast.emit('Loser', 'You lost 😞, Better luck next time!');
          // Emit game ended
          io.in(gameid).emit('gameEnded');

          // 0 the both ready value
          io.sockets.adapter.rooms[gameid].bothReady = 0;

          // 0 the turnCounter
          io.sockets.adapter.rooms[gameid].turnCounter = 0;
        }
      });

      // Chec if game is tied
      if (io.sockets.adapter.rooms[gameid].turnCounter >= 9) {
        // Emit tie
        io.in(gameid).emit('gameTied');
        // 0 the both ready value
        io.sockets.adapter.rooms[gameid].bothReady = 0;
        // 0 the turnCounter
        io.sockets.adapter.rooms[gameid].turnCounter = 0;
      }

    }
    // Player 2
    else {
      io.sockets.adapter.rooms[gameid].turnCounter++;

      io.sockets.adapter.rooms[gameid].player2.moves.push(lastMove);
      io.sockets.adapter.rooms[gameid].player2.tilesPlayed = tiles;
      console.log('Player 2 tile IDs: ');
      console.log(io.sockets.adapter.rooms[gameid].player2.moves);
      console.log('Player 2 tiles played: ');
      console.log(io.sockets.adapter.rooms[gameid].player2.tilesPlayed);
      console.log(
        `Current turn counter: ${io.sockets.adapter.rooms[gameid].turnCounter}`
      );
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

          // Emit win
          socket.emit('Winner', 'You won 🔥, Congratulations!');
          // Emit lose
          socket.broadcast.emit('Loser', 'You lost 😞, Better luck next time!');
          // Emit game ended
          io.in(gameid).emit('gameEnded');
          // 0 the both ready value
          io.sockets.adapter.rooms[gameid].bothReady = 0;
          // 0 the turnCounter
          io.sockets.adapter.rooms[gameid].turnCounter = 0;
        }
      });

      // Chec if game is tied
      if (io.sockets.adapter.rooms[gameid].turnCounter >= 9) {
        // Emit tie
        io.in(gameid).emit('gameTied');
        // 0 the both ready value
        io.sockets.adapter.rooms[gameid].bothReady = 0;
        // 0 the turnCounter
        io.sockets.adapter.rooms[gameid].turnCounter = 0;
      }

    }

    socket.to(gameid).emit('yourTurn', moves[moves.length - 1]);
  });

  socket.on('playAgainClick', () => {
    if (socket.id === io.sockets.adapter.rooms[gameid].player1.instanceid) {
      io.sockets.adapter.rooms[gameid].bothReady++;
      io.in(gameid).emit('playAgainClicked', 'Player 1 ✅');
    }
    if (socket.id === io.sockets.adapter.rooms[gameid].player2.instanceid) {
      io.sockets.adapter.rooms[gameid].bothReady++;
      io.in(gameid).emit('playAgainClicked', 'Player 2 ✅');
    }

    if (io.sockets.adapter.rooms[gameid].bothReady === 2) {
      console.log(`Both are ready, ${io.sockets.adapter.rooms[gameid].bothReady}`);
      io.in(gameid).emit('restartGame');
    }
  });

  socket.on('restartGame', (data) => {
    //gameid = data;

    console.log(gameid);

    // Reset players values
    io.sockets.adapter.rooms[gameid].player1.moves.length = 0;
    io.sockets.adapter.rooms[gameid].player2.moves.length = 0;

    io.sockets.adapter.rooms[gameid].player1.tilesPlayed = 0;
    io.sockets.adapter.rooms[gameid].player2.tilesPlayed = 0;

    io.to(io.sockets.adapter.rooms[gameid].player1.instanceid).emit(
      'restartTogglePlayer'
    );
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