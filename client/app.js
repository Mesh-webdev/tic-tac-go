// Global variables

// Colors array
const colors = [{
    'name': 'red',
    'hash': '#ff0000',
  },
  {
    'name': 'yellow',
    'hash': '#ffff00',
  },
  {
    'name': 'blue',
    'hash': '#0000ff',
  },
  {
    'name': 'purple',
    'hash': '#800080',
  },
];

// is client allowed to play or not
let allowed = false;

// Is game playable or not
let playable = true;

// Player object
let Player = {
  nickname: '',
  marker: '',
  color: '',
  moves: [], // this is for keeping track of the tiles ids
  tilesPlayed: 0, // This for checking win conditions
  instanceid: '',
};

// Game object
let Game = {
  gameid: '',
  winComb: [7, 56, 448, 73, 146, 292, 273, 84],
};

// Restart game value to check if both want to play again; 0 = No, 1 = No, 2 = Yes
let BothReady = 0;

// SVG marker object
import {
  Marker
} from './marker.js';

const socket = io.connect('http://localhost:8000');
socket.on('User-connected', (Data) => {
  //console.log(`Connected with ID: ${Data.instance}`);
  Player.instanceid = Data.instance;
});

// Getting the elements

// --- Buttons
const joinBtn = $('#join-game');
const createBtn = $('#create-game');

// --- Elements

// --- --- Top section
const header = $('.header');
const nav = $('.navbar');
const mainHeader = $('.main-header');
const title = $('.title');
const subTitle = $('.sub-title');
const action = $('.call-to-action');
const GO = $('#GO-span');

// --- --- Main section
const body = $('body');
const main = $('main');
const container = $('.container');
const gameBox = $('.game-box');

// --- --- Game-box forms
const joinForm = $('.join-form');
const createForm = $('.create-form');

// --- --- --- Join game form
const joinGameJoinRoomBtn = $('#join-game-room');
const joinGameNickname = $('#join-game-nickname');
const joinGameIDInfo = $('.game-id-info');
const joinGameIDInfoSVG = $('#game-id-info-svg');
const joinGameIDPopover = $('#join-game-id-popover');
const joinGameGameID = $('#join-game-id');

// --- --- --- Create game form
const createGameCreateRoomBtn = $('#create-game-room');
const createGameNickname = $('#create-game-nickname');
const createGameTypeX = $('#type-X');
const createGameTypeO = $('#type-O');
const createGameColor = $('.color');
const createGameIDInfoSVG = $('#create-game-id-info-svg');
const createGameIDInfo = $('.create-game-id-info');
const createGameIDPopover = $('#create-game-id-popover');
const createGameGameIDCopy = $('.copy-game-id');
const createGameGameIDCopied = $('#create-game-id-copied');
const createGameGeneratedGameID = $('#generated-game-id');

// --- --- --- Game-box board
const mainBoard = $('.board-main');
const board = $('.board');
const boardTitleContainer = $('.board-title');
const boardTitle = $('#boardTitle');
const tiles = document.querySelectorAll('.tile');
const playAgain = $('#playAgain');
const playAgainList = $('.play-again-playerlist');
const disconnected = $('.disconnected');
const disconnectedBtn = $('#disconnectedPlayAgain');

// Onload animations
title.fadeIn(600, () => {
  subTitle.slideDown(300, () => {
    action.fadeIn(300);
  });
});

// event listeners

// Landing page elements events
joinBtn.on('click', displayJoinGameForm);
createBtn.on('click', displayCreateGameForm);

// Game-box page events

// - Create Form events

// --- create game > create
createGameCreateRoomBtn.on('click', createGameRoom);

// --- create game > player type
createGameTypeX.on('click', () => {
  createGameTypeO.removeClass('chosen-type');
  createGameTypeX.addClass('chosen-type');
  createGameTypeX.toggleClass('rotate');
});
createGameTypeO.on('click', () => {
  createGameTypeX.removeClass('chosen-type');
  createGameTypeO.addClass('chosen-type');
  createGameTypeO.toggleClass('rotate');
});
// --- create game > player color
createGameColor.on('click', (e) => {
  createGameColor.removeClass('chosen-color');
  $(`.${e.target.classList[1]}`).toggleClass('chosen-color');
});
// --- create game > copy ID
createGameGameIDCopy.on('click', () => {
  let Clipboard = new ClipboardJS('.copy-game-id');
  Clipboard.on('success', (e) => {
    e.clearSelection();
    createGameGameIDCopied.fadeIn(200, () => {
      setTimeout(() => {
        createGameGameIDCopied.fadeOut(100);
      }, 600);
    });
  });
  Clipboard.on('error', (e) => {
    //console.log(e);
  });
});

// - Join Form events

// --- join game > join
joinGameJoinRoomBtn.on('click', joinGameRoom);

// Info elements events

// --- Join game > game id info
joinGameIDInfo.on('mouseover', () => {
  joinGameIDPopover.fadeIn(100);
});
joinGameIDInfo.on('mouseleave', () => {
  joinGameIDPopover.fadeOut(100);
});
// --- Create game > game id info
createGameIDInfo.on('mouseover', () => {
  createGameIDPopover.fadeIn(100);
});
createGameIDInfo.on('mouseleave', () => {
  createGameIDPopover.fadeOut(100);
});

title.on('click', () => {
  window.location.reload()
});

// IO events listeners/related functions

// --- server emits 'gameCreated' when the player succesfully created the game
socket.on('gameCreated', (data) => {
  //console.log(data);
});

socket.on('startCounter', async () => {
  await timerCountdown(1)
    .then(() => {
      //console.log('Finished coutning');
      socket.emit('counterFinished');
    })
    .catch(() => {
      //console.log('Error counting down');
    });
});

socket.on('updateBoardTitle', () => {
  boardTitle.text('Waiting for the other player to play');
});

socket.on('gameStarted', (data) => {
  // Should add events for hover and click for tiles
  board.removeClass('board-disabled');

  // allow player1 to play
  togglePlayer(true);

  // Update board title
  updateBoardTitle();

  addTileEvents();
});

socket.on('setPlayerInfo', (data) => {
  Game.Player1 = data.player1;
  Game.Player2 = data.player2;

  // Set svg Colors
  //console.log(data);

  if (Game.Player1.marker === 'X') {
    Marker.X = Marker.X.replace('MARKER_CLASS', `marker-${data.player1.color}`);
    Marker.O = Marker.O.replace('MARKER_CLASS', `marker-${data.player2.color}`);
  } else {
    Marker.X = Marker.X.replace('MARKER_CLASS', `marker-${data.player2.color}`);
    Marker.O = Marker.O.replace('MARKER_CLASS', `marker-${data.player1.color}`);
  }
});

// --- server emits 'yourTurn' when current client is allowed to play
socket.on('yourTurn', (data) => {
  togglePlayer(true);

  // Update board title
  updateBoardTitle();

  let playedMarker = Player.marker === 'X' ? 'O' : 'X';
  let tileid = `tile${data}`;

  // Show the other player marker in the tile he chose

  // add X/Oplayed class
  $(`#${tileid}`).addClass(`${playedMarker}played`);

  // append X/O svg
  if (playedMarker === 'X') $(`#${tileid}`).append(Marker.X);
  else $(`#${tileid}`).append(Marker.O);

  // Add the tile events (allow the current client to play)
  addTileEvents();
});

// --- Winner listener
socket.on('Winner', (data) => {
  // Set game to unplayable
  playable = false;

  // unbind all events
  unbindTileEvents();

  // Disable board
  board.addClass('board-disabled');

  // Update title
  updateBoardTitle(data);
});

// --- Loser listener
socket.on('Loser', (data) => {
  // Set game to unplayable
  playable = false;

  // unbind all events
  unbindTileEvents();

  // Disable board
  board.addClass('board-disabled');

  // Update title
  updateBoardTitle(data);
});

socket.on('gameEnded', () => {
  //console.log('GAME ENDED!');
  playable = false;

  playAgain.slideDown('300');

  playAgain.on('click', (e) => {
    socket.emit('playAgainClick', Game);
    $(`#${e.target.id}`).off();
  });

  // Empty play again section
  playAgainList.html('');
});

socket.on('playAgainClicked', (data) => {
  playAgainList.fadeIn(200, () => {
    playAgainList.append(`${data} <br>`);
  });
});

socket.on('restartGame', () => {
  //console.log('Listened to restartGame');
  restartGame();
});

socket.on('restartTogglePlayer', () => {
  unbindTileEvents();
  togglePlayer(true);
  addTileEvents();
});

socket.on('gameTied', () => {
  playable = false;

  playAgain.slideDown('300');

  playAgain.on('click', (e) => {
    socket.emit('playAgainClick', Game);
    $(`#${e.target.id}`).off();
  });

  // Empty play again section
  playAgainList.html('');

  // Update board title
  updateBoardTitle('Game is tied ⚔');
});

socket.on('userDisconnected', () => {
  disconnected.css('display', 'grid');

  playAgain.off()
  unbindTileEvents();
  board.addClass('board-disabled');

  // Player disconnect event
  disconnectedBtn.on('click', () => {
    disconnected.slideUp(400, () => {
      window.location.reload()
    })
  })

});

// --- Gets the clients that joined in the given gameid
function getClients(gameid) {
  id = `Game-${gameid.toLowerCase()}`;

  socket.emit('list', id);

  socket.on('clients', (clients) => {
    //console.log(`Clients in ${id} :`);
    //console.log(clients);
  });
}

// Events/Functions
async function displayCreateGameForm() {
  // get and assign game id
  generateGameID();
  await Animate()
    .then(() => {
      animateMain();
      animateTitle();
      animateCreateForm();
    })
    .catch(() => {
      // handle err
    });
}

async function displayJoinGameForm() {
  await Animate()
    .then(() => {
      animateMain();
      animateTitle();
      animateJoinForm();
    })
    .catch(() => {
      // handle err
    });
}

async function hideCreateGameForm() {
  createForm.fadeOut(300, () => {
    mainBoard.css('display', 'grid');
  });
}
async function hideJoinGameForm() {
  joinForm.fadeOut(300, () => {
    mainBoard.css('display', 'grid');
  });
}

function createGameRoom() {
  // Get player data(nickname, color and marker type)

  // Nickname
  if (joinGameNickname.val().length === 0) {
    Player.nickname = 'No Nickname'
  } else {
    Player.nickname = joinGameNickname.val();
  }


  if (document.querySelector('.chosen-type') != null) {
    // Marker, check if the chosen type is type X; marker = x else marker = o
    Player.marker =
      document.querySelector('.chosen-type').id === 'type-X' ? 'X' : 'O';
  } else {
    let randomed = Math.round(Math.random());
    Player.marker = randomed === 1 ? 'X' : 'O';
  }

  // Color
  Player.color = getChosenColor();

  // Emit a create game event
  socket.emit(
    'createGame', {
      Game,
      Player,
    },
    (data) => {
      if (data.status) {
        // Hide form and Show board
        hideCreateGameForm();

        // Show message for player 1
        boardTitle.text('Waiting for the other player to join');

        // Set svg color
        if (Player.marker === 'X') {
          Marker.X = Marker.X.replace('MARKER_CLASS', `marker-${Player.color}`);
        } else {
          Marker.O = Marker.O.replace('MARKER_CLASS', `marker-${Player.color}`);
        }

        // Creat CSS animation then add it to boardTitle.css() here
      } else {
        // console.log(`Error creating a room: ${data.message}`);
      }
    }
  );
}

async function joinGameRoom() {
  // Get and assign player information
  // Nickname
  if (joinGameNickname.val().length === 0) {
    Player.nickname = 'No Nickname'
  } else {
    Player.nickname = joinGameNickname.val();
  }

  // Color
  Player.color = getChosenColor();

  // Player id
  // Already assigned, see above; on('User-connected') event.

  // Game id
  if (joinGameGameID.val().trim().length === 0) {
    alert("Can't join without a Game ID ⛔")
    return
  } else {
    Game.gameid = joinGameGameID.val().toLowerCase();
  }

  socket.emit(
    'joinGame', {
      Game,
      Player,
    },
    (data) => {
      // If sucessfully joined a game
      if (data.status) {
        hideJoinGameForm();
        //console.log(data.marker);
        Player.marker = data.marker;

        // Emit a start game event(?)
        socket.emit('startGame', Game.gameid);

        // Change the title to 'Player 1 turn(?)
      } else {
        alert(data.message)
      }
    }
  );
}

function getCurrentTurn() {
  socket.emit('currentTurn', Game);
}

function getChosenColor() {
  let hashColor = 'red';

  if (document.querySelector('.chosen-color') === null) return hashColor

  colors.forEach((clr) => {
    if (clr.name === document.querySelector('.chosen-color').classList[1]) {
      hashColor = clr.name;
    }
  });
  return hashColor;
}

function generateGameID() {
  // Get and display the game ID from the backend
  socket.emit('generateID', 'Generating a game ID', (data) => {
    if (data.status) {
      Game.gameid = data.id;
      createGameGeneratedGameID.text(data.id.toUpperCase());
    }
  });
}

function updateBoardTitle(text = 'NONE') {
  if (text === 'NONE') {
    if (playable) {
      boardTitle.fadeOut(200, () => {
        if (allowed) boardTitle.text('Your turn to play');
        if (!allowed & playable)
          boardTitle.text('Waiting for the other player to play');
        boardTitle.fadeIn(300);
      });
    }
  } else {
    boardTitle.fadeOut(200, () => {
      boardTitle.text(text);
      boardTitle.fadeIn(300);
    });
  }
}

function togglePlayer(_allowed) {
  if (playable) {
    allowed = _allowed;

    if (_allowed) board.removeClass('board-disabled');
    if (!_allowed) board.addClass('board-disabled');
  }
}

function timerCountdown(timeleft) {
  return new Promise((resolve, reject) => {
    var countdownTimer = setInterval(() => {
      timeleft--;

      boardTitle.text(`Game starting in ${timeleft}`);
      // console.log(timeleft);

      if (timeleft <= 0) {
        clearInterval(countdownTimer);
        resolve(true);
      }
    }, 1000);
  });
}

function unbindTileEvents() {
  tiles.forEach((tile) => {
    $(`#${tile.id}`).off();
  });
}

function Animate() {
  return new Promise((resolve, reject) => {
    //1- Hide centered elements
    subTitle.fadeOut(100);
    action.fadeOut(100);
    title.fadeOut(100, async () => {
      //2- Move clip path

      // Clip path to cover the full page
      await animateClip('bottom')
        .then(async () => {
          // clip path to go back up
          await animateClip('top')
            .then(() => {
              // position and size main/game box
              main.css({
                'position': 'absolute',
                'width': '100%',
                'top': '9%',
              });
              //gameBox.css('height', '650px');
              // Show elements at the top
              title.css({
                'font-size': '3em',
                'font-family': 'Cairo-regular, sans-serif',
              });
              mainHeader.css({
                'top': '29px',
              });
              // header.css('background', 'none')
              body.css(
                'background',
                'linear-gradient(180deg, var(--bg1), var(--bg))'
              );
              resolve();
            })
            .catch();
        })
        .catch();
    });
  });
}

function addTileEvents() {
  if (playable === true) {
    tiles.forEach((tile) => {
      if (
        tile.classList.contains('Xplayed') ||
        tile.classList.contains('Oplayed')
      ) {
        return;
      } else {
        // Hover effect
        $(`#${tile.id}`).on('mouseover', (e) => {
          $(e.target).addClass(`tileHover${Player.marker}`);
        });

        $(`#${tile.id}`).on('mouseleave', (e) => {
          $(e.target).removeClass(`tileHover${Player.marker}`);
        });

        // Click event
        $(`#${tile.id}`).on('click', (e) => {
          turnPlayed(e);
        });
      }
    });
  } else {
    return;
  }
}

function turnPlayed(e) {
  let gameid = Game.gameid;
  let tile = parseInt($(e.target).attr('id').slice(4));

  // Add the tile played to the Player moves array
  Player.moves.push(tile.toString());
  Player.tilesPlayed += tile;
  //console.log(`Tile ids: `);
  //console.log(Player.moves);
  //console.log('Tiles played');
  //console.log(Player.tilesPlayed);

  // remove the hover class
  $(e.target).removeClass(`tileHover${Player.marker}`);

  // Add the X/O played class
  $(e.target).addClass(`${Player.marker}played`);

  // Add the SVG
  if (Player.marker === 'X') $(e.target).append(Marker.X);
  else $(e.target).append(Marker.O);

  // Then unbind all events
  unbindTileEvents();

  togglePlayer(false);

  // Update board title
  updateBoardTitle();

  // Communicate with the backend
  //console.log(`Emitted turnPlayed to backend, ${Game.gameid}`);
  socket.emit('turnPlayed', {
    tile,
    gameid
  });

  //console.log(`is allowed ${allowed}`);
}

function restartGame() {
  // Reste global values
  allowed = false;
  playable = true;

  // reset player values
  Player.moves.length = 0;
  Player.tilesPlayed = 0;

  //Emit to backend to reset server-side values
  socket.emit('restartGame', Game);

  // Reset the UI
  tiles.forEach((tile) => {
    // Remove classes
    tile.classList.remove('Xplayed');
    tile.classList.remove('Oplayed');

    // Remove child SVGs
    $(`#${tile.id}`).children('svg').remove();

    // show a restarting msg then Hide play again button
    setTimeout(() => {
      playAgainList.fadeOut(400, () => {
        playAgainList.html('Restarting game...');
        playAgainList.fadeIn(200, () => {
          setTimeout(() => {
            playAgainList.fadeOut(10);
            playAgain.fadeOut(100);
          }, 1000);
        });
      });
    }, 1000);
  });

  updateBoardTitle();
}

// MISC animations/events
function animateMain() {
  setTimeout(() => {
    main.fadeIn(300);
  }, 300);
}

function animateTitle() {
  GO.css('color', 'var(--btn-bg)');
  title.fadeIn(300);
}

function animateJoinForm() {
  setTimeout(() => {
    joinForm.fadeIn(300);
  }, 300);
}

function animateCreateForm() {
  setTimeout(() => {
    createForm.fadeIn(300);
  }, 300);
}

function animateClip(direction) {
  return new Promise((resolve, reject) => {
    // bottom
    if (direction === 'bottom') {
      header.css('transition', 'all 0.7s ease-in-out');
      header.css('height', '100%');
      header.css(
        'clip-path',
        'polygon(100% 0%, 100% 0px, 100% 100%, 0px 100%, 0px 0px)'
      );
      setTimeout(() => {
        resolve();
      }, 700);
    }

    // top
    if (direction === 'top') {
      header.css('transition', 'all 0.3s ease-in-out');
      header.css('height', 'var(--header-height)');
      header.css(
        'clip-path',
        'polygon(50% 0%, 100% 0px, 100% 50%, 0px 100%, 0px 0px)'
      );
      setTimeout(() => {
        resolve();
      }, 300);
    }
  });
}