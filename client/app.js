const socket = io.connect('http://localhost:8000');

socket.on('User-connected', (Data) => {
    console.log(Data.instance);
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

// --- --- Main section
const main = $('main')
const container = $('.container')
const board = $('.board');


// Onload hide elements
title.hide();
subTitle.hide();
action.hide();
main.hide();
board.hide();

// Onload animations
title.fadeIn(600, () => {
    subTitle.slideDown(300, () => {
        action.fadeIn(300)
    })
})

// event listeners
joinBtn.on('click', joinGame);
createBtn.on('click', createGame);



// Events
function joinGame() {
    AnimateHeader();
    showJoinForm();
}

function createGame() {

    console.log('Create a game');

}


function AnimateHeader() {

    //1- Hide
    subTitle.fadeOut(100);
    action.fadeOut(100)
    title.fadeOut(100, () => {
        //2- Move
        header.css('clip-path', 'polygon(50% 0%, 100% 0px, 100% 120px, 1px 120px, 0px 0px)')
        nav.css('height', '120px')
        title.css({
            'font-size': '3em',
            'font-family': 'Cairo-regular, sans-serif'
        });
        mainHeader.css({
            'top': '29px'
        })
        header.css('height', '120px')
    });

}

function showJoinForm() {
    setTimeout(() => {
        title.fadeIn(100);
        //3- Show
        main.fadeIn(100)
    }, 500)
}