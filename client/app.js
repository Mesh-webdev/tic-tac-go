const socket = io.connect('http://localhost:8000');
socket.on('User-connected', (Data) => {
    console.log(Data.instance);
})

$(document).ready(() => {
    $('[data-toggle="popover"]').popover();
})

// Getting the elements

// --- Buttons
const joinBtn = $('#join-game');
const createBtn = $('#create-game');

// --- Elements

// --- --- Top section
const header = $('.header')
const nav = $('.navbar')
const mainHeader = $('.main-header');
const title = $('.title');
const subTitle = $('.sub-title');
const action = $('.call-to-action');
const GO = $('#GO-span');

// --- --- Main section
const body = $('body')
const main = $('main')
const container = $('.container')
const gameBox = $('.game-box')

// --- --- Game-box form
const joinForm = $('.join-form')
const createForm = $('.create-form')
const gameID = $('#game-id')
const joinRoomBtn = $('#join-game-room')
const joinGameIDInfo = $('.game-id-info');
const createGameIDInfo = $('.create-game-id-info');
const joinGameIDInfoSVG = $('#game-id-info-svg');
const createGameIDInfoSVG = $('#create-game-id-info-svg');
const joinGameIDPopover = $('#join-game-id-popover');
const createGameIDPopover = $('#create-game-id-popover');
const createGameTypeX = $('#type-X');
const createGameTypeO = $('#type-O');
const createGameColor = $('.color');
const createGameGameIDCopy = $('.copy-game-id');
const createGameGameIDCopied = $('#create-game-id-copied');
const createGameGeneratedGameID = $('#generated-game-id');


// --- --- Game-box board
const board = $('.board');

// --- Elements


// Onload hide elements
title.hide();
subTitle.hide();
action.hide();
main.hide();
joinForm.hide();
createForm.hide();
board.hide();
joinGameIDPopover.hide();
createGameIDPopover.hide();


// Onload animations
title.fadeIn(600, () => {
    subTitle.slideDown(300, () => {
        action.fadeIn(300)
    })
})


// event listeners

// --- Landing elements events
joinBtn.on('click', joinGame);
createBtn.on('click', createGame);

// --- game-box elements events
joinRoomBtn.on('click', joinRoom);

// --- create game > player type
createGameTypeX.on('click', () => {
    createGameTypeO.removeClass('chosen-type')
    createGameTypeX.addClass('chosen-type')
    createGameTypeX.toggleClass('rotate')
})
createGameTypeO.on('click', () => {
    createGameTypeX.removeClass('chosen-type')
    createGameTypeO.addClass('chosen-type')
    createGameTypeO.toggleClass('rotate')
})
// --- create game > player color
createGameColor.on('click', (e) => {
    createGameColor.removeClass('chosen-color')
    $(`.${e.target.classList[1]}`).toggleClass('chosen-color')
})

// --- create game > copy ID
createGameGameIDCopy.on('click', () => {
    let Clipboard = new ClipboardJS('.copy-game-id');
    Clipboard.on('success', (e) => {
        e.clearSelection()
        createGameGameIDCopied.fadeIn(200, () => {
            setTimeout(() => {
                createGameGameIDCopied.fadeOut(100)
            }, 600)
        })
    })
    Clipboard.on('error', (e) => {
        console.log(e);
    })
})

// --- Info elements events

// Join game > game id info
joinGameIDInfo.on('mouseover', () => {
    joinGameIDPopover.fadeIn(100);

})
joinGameIDInfo.on('mouseleave', () => {
    joinGameIDPopover.fadeOut(100);
})
// Create game > game id info
createGameIDInfo.on('mouseover', () => {
    createGameIDPopover.fadeIn(100);

})
createGameIDInfo.on('mouseleave', () => {
    createGameIDPopover.fadeOut(100);
})



title.on('click', () => {
    window.location = 'http://localhost:8000/'
})


// Events
async function joinGame() {
    await Animate()
        .then(() => {
            animateMain()
            animateTitle()
            animateJoinForm()
        })
        .catch(() => {
            // handle err
        })
}

async function createGame() {

    await Animate()
        .then(() => {
            animateMain()
            animateTitle()
            animateCreateForm()
        })
        .catch(() => {
            // handle err
        })

}

async function joinRoom() {
    joinForm.fadeOut(100, () => {
        board.fadeIn(100)
    })
}

function Animate() {

    return new Promise((resolve, reject) => {
        //1- Hide centered elements
        subTitle.fadeOut(100);
        action.fadeOut(100)
        title.fadeOut(100, async () => {
            //2- Move clip path

            // Clip path to cover the full page
            await animateClip("bottom")
                .then(async () => {
                    // clip path to go back up
                    await animateClip("top")
                        .then(() => {
                            // position and size main/game box
                            main.css({
                                'position': 'absolute',
                                'width': '100%',
                                'top': '9%'
                            })
                            gameBox.css('height', '650px')
                            // Show elements at the top
                            title.css({
                                'font-size': '3em',
                                'font-family': 'Cairo-regular, sans-serif'
                            });
                            mainHeader.css({
                                'top': '29px'
                            })
                            // header.css('background', 'none')
                            body.css('background', 'linear-gradient(180deg, var(--bg1), var(--bg))')
                            resolve();
                        })
                        .catch()
                })
                .catch()
        });

    })


}


// MISC animations
function animateMain() {
    setTimeout(() => {
        main.fadeIn(300)
    }, 300)
}

function animateTitle() {
    GO.css('color', 'var(--btn-bg)')
    title.fadeIn(300);
}

function animateJoinForm() {
    setTimeout(() => {
        joinForm.fadeIn(300)
    }, 300)
}

function animateCreateForm() {
    setTimeout(() => {
        createForm.fadeIn(300)
    }, 300)
}

function animateClip(direction) {

    return new Promise((resolve, reject) => {
        // bottom
        if (direction === "bottom") {
            header.css('transition', 'all 0.7s ease-in-out')
            header.css('height', '100%')
            header.css('clip-path', 'polygon(100% 0%, 100% 0px, 100% 100%, 0px 100%, 0px 0px)')
            setTimeout(() => {
                resolve()
            }, 700)

        }

        // top
        if (direction === "top") {
            header.css('transition', 'all 0.3s ease-in-out')
            header.css('height', 'var(--header-height)')
            header.css('clip-path', 'polygon(50% 0%, 100% 0px, 100% 50%, 0px 100%, 0px 0px)')
            setTimeout(() => {
                resolve();
            }, 300)
        }

    })
}