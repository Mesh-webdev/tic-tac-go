console.clear();
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

let games = [];

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
  let socketid = socket.id;
  console.log('==========CONNECTED========');
  console.log(socket.id);
  console.log('Games array:');
  console.log(games);
  socket.emit('User-connected', {
    instance: socket.id,
  });

  socket.on('disconnect', () => {
    let disconnectedId = socket.id;
    let roomIndex = -1;

    let player1Index;
    let player2Index;

    console.log(`Disconnected: ${disconnectedId}`);

    // Find room index if player 1 disconnected
    player1Index = games.findIndex(
      (Game) => Game.player1.instanceid === disconnectedId
    );
    // Find room index if player 2 disconnected
    player2Index = games.findIndex(
      (Game) => Game.player2.instanceid === disconnectedId
    );

    // Check if player1 in a room
    if (player1Index >= 0) {
      roomIndex = player1Index;
    }

    // Check if player2 in a room
    if (player2Index >= 0) {
      roomIndex = player2Index;
    }

    // if room <= 0
    if (roomIndex >= 0) {
      // emit a broadcast event of userDisconnected to the other player
      socket.to(games[roomIndex].gameid).emit('userDisconnected');
      // delete the room from games[]
      games.splice(roomIndex, 1);
    }
  });

  socket.on('createGame', (data, fn) => {
    let _player = data.Player;
    let _game = data.Game;
    let _gameid = `Game-${_game.gameid}`;

    let Player = {
      nickname: _player.nickname,
      marker: _player.marker,
      color: _player.color,
      tilesPlayed: 0, // This for checking win conditions
      instanceid: _player.instanceid,
    };
    let Game = {
      gameid: _gameid,
      player1: Player,
      player2: {},
      turnCounter: 0,
      bothReady: 0,
    };

    socket.join(_gameid, (err) => {
      if (err) {
        console.log(`Unable to create a room, error: ${err}`);
        fn({
          status: false,
          message: err,
        });
      } else {
        games.push(Game);

        io.sockets.in(_gameid).emit('gameCreated');
        fn({
          status: true,
        });
      }
    });
  });

  socket.on('joinGame', (data, fn) => {
    let _player = data.Player;
    let _game = data.Game;
    let _gameid = `Game-${_game.gameid}`;
    let _gameIndex = games.findIndex((Game) => Game.gameid === _gameid);

    // Room validation

    // Room is unavailable
    if (typeof io.sockets.adapter.rooms[_gameid] === 'undefined') {
      console.log(`${_gameid} room doesnt exist`);
      fn({
        status: false,
        message: `${_gameid} room doesnt exist`,
      });
    } else {
      //Game is available and not full
      let Player = {
        nickname: _player.nickname,
        marker: games[_gameIndex].player1.marker === 'X' ? 'O' : 'X',
        color: _player.color,
        tilesPlayed: 0, // This for checking win conditions
        instanceid: _player.instanceid,
      };
      if (io.sockets.adapter.rooms[_gameid].length < 2) {
        socket.join(_gameid, (err) => {
          if (err) {
            console.log(`Couldn't join, Error ${err}`);
            fn({
              status: false,
              message: err,
            });
          } else {
            // Successfully joined

            // Attach player2 to the Game obj in games[]
            games[_gameIndex].player2 = Player;
            console.log('Created a Game:');
            console.log(games.find((Game) => Game.gameid === _gameid));
            console.log('===========================');
            console.log(`Current games array ${games.length}: `);

            socket.emit('gameCreated');
            fn({
              status: true,
              gameid: _gameid,
              marker: games[_gameIndex].player1.marker === 'X' ? 'O' : 'X',
            });
          }
        });
        //Game is available but full
      } else {
        console.log(`${_gameid} room is full`);
        fn({
          status: false,
          message: `${_gameid} room is full`,
        });
      }
    }
  });

  socket.on('startGame', (data, fn) => {
    let _gameid = `Game-${data}`;
    let _game = games.find((Game) => Game.gameid === _gameid);

    let player1 = _game.player1;
    let player2 = _game.player2;

    io.in(_gameid).emit('setPlayerInfo', _game);

    io.in(_gameid).emit('startCounter');
    socket.on('counterFinished', () => {
      io.to(player1.instanceid).emit('gameStarted');
      io.to(player2.instanceid).emit('updateBoardTitle');
    });
  });

  socket.on('turnPlayed', (data) => {
    let _gameid = `Game-${data.gameid}`;
    let tile = data.tile;

    let _gameIndex = games.findIndex((Game) => Game.gameid === _gameid);
    // Update game object in games[] with the tile played

    // Player 1
    if (socket.id === games[_gameIndex].player1.instanceid) {
      // Increase the turn counter
      games[_gameIndex].turnCounter++;

      // Add the tile played to tilesPlayed value of player1
      games[_gameIndex].player1.tilesPlayed += tile;
      console.log('Player 1 tilesPlayed: ');
      console.log(games[_gameIndex].player1.tilesPlayed);
      console.log(`Current turn counter: ${games[_gameIndex].turnCounter}`);
      console.log('==================================');

      // Check if player 1 has won
      console.log('Checking Player 1 win condition:');
      winConditions.forEach((winPosition) => {
        console.log(
          `Condition: ${winPosition}. Tiles played: ${games[_gameIndex].player1.tilesPlayed}`
        );
        if (
          (winPosition & games[_gameIndex].player1.tilesPlayed) ==
          winPosition
        ) {
          console.log('Player 1 won!');

          // Emit win
          io.in(_gameid).emit('Winner', 'You won 🔥, Congratulations!');
          // Emit lose
          socket
            .to(_gameid)
            .emit('Loser', 'You lost 😞, Better luck next time!');
          // Emit game ended
          io.in(_gameid).emit('gameEnded');

          // 0 the both ready value
          games[_gameIndex].bothReady = 0;

          // 0 the turnCounter
          games[_gameIndex].turnCounter = 0;
        }
      });

      // Check if game is tied
      if (games[_gameIndex].turnCounter >= 9) {
        // Emit tie
        io.in(_gameid).emit('gameTied');
        // 0 the both ready value
        games[_gameIndex].bothReady = 0;

        // 0 the turnCounter
        games[_gameIndex].turnCounter = 0;
      }
    }

    // ======================================

    // Player 2
    else {
      // Increase the turn counter
      games[_gameIndex].turnCounter++;

      // Add the tile played to tilesPlayed value of player1
      games[_gameIndex].player2.tilesPlayed += tile;
      console.log('Player 2 tilesPlayed: ');
      console.log(games[_gameIndex].player2.tilesPlayed);
      console.log(`Current turn counter: ${games[_gameIndex].turnCounter}`);
      console.log('==================================');

      // Check if player 1 has won
      console.log('Checking Player 2 win condition:');
      winConditions.forEach((winPosition) => {
        console.log(
          `Condition: ${winPosition}. Tiles played: ${games[_gameIndex].player2.tilesPlayed}`
        );
        if (
          (winPosition & games[_gameIndex].player2.tilesPlayed) ==
          winPosition
        ) {
          console.log('Player 1 won!');

          // Emit win
          io.in(_gameid).emit('Winner', 'You won 🔥, Congratulations!');
          // Emit lose
          io.in(_gameid).broadcast.emit(
            'Loser',
            'You lost 😞, Better luck next time!'
          );
          // Emit game ended
          io.in(_gameid).emit('gameEnded');

          // 0 the both ready value
          games[_gameIndex].bothReady = 0;

          // 0 the turnCounter
          games[_gameIndex].turnCounter = 0;
        }
      });

      // Check if game is tied
      if (games[_gameIndex].turnCounter >= 9) {
        // Emit tie
        io.in(_gameid).emit('gameTied');
        // 0 the both ready value
        games[_gameIndex].bothReady = 0;

        // 0 the turnCounter
        games[_gameIndex].turnCounter = 0;
      }
    }

    console.log(`Emitting yourTurn back to frontend, ${_gameid}`);
    socket.to(_gameid).emit('yourTurn', tile);
  });

  socket.on('playAgainClick', (data) => {
    let _gameid = `Game-${data.gameid}`;
    let _gameIndex = games.findIndex((Game) => Game.gameid === _gameid);

    console.log(data);

    // Check if player 1 has clicked
    if (socket.id === games[_gameIndex].player1.instanceid) {
      games[_gameIndex].bothReady++;
      io.in(_gameid).emit('playAgainClicked', 'Player 1 ✅');
    }
    // Check if player 2 has clicked
    if (socket.id === games[_gameIndex].player2.instanceid) {
      games[_gameIndex].bothReady++;
      io.in(_gameid).emit('playAgainClicked', 'Player 2 ✅');
    }

    if (games[_gameIndex].bothReady === 2) {
      console.log(`Both are ready, ${games[_gameIndex].bothReady}`);
      io.in(_gameid).emit('restartGame');
    }
  });

  socket.on('restartGame', (data) => {
    let _gameid = `Game-${data.gameid}`;
    let _gameIndex = games.findIndex((Game) => Game.gameid === _gameid);

    // Reset players values
    games[_gameIndex].player1.tilesPlayed = 0;
    games[_gameIndex].player2.tilesPlayed = 0;

    io.to(games[_gameIndex].player1.instanceid).emit('restartTogglePlayer');
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