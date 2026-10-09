let gameStarted = false;

function startGame() {
  if (gameStarted) return;
  gameStarted = true;

  //Drop focus so a later Space press does not "click" the hidden button again
  document.getElementById('start-button').blur();
  document.getElementsByClassName('all-elements')[0].style.display = 'grid';
  document.getElementsByClassName('start')[0].style.display = 'none';

  const overworld = new Overworld({
    element: document.querySelector('.game-container'),
  });

  overworld.start();
}

document.getElementById('start-button').addEventListener('click', startGame);

// Space on the start screen does the same as the "Let's go!" button.
// The intro message binds its own Space listener while this keydown is being
// dispatched, and listeners added during dispatch do not see that same event,
// so this press does not skip the first message.
document.addEventListener('keydown', (event) => {
  if (gameStarted || event.repeat || event.code !== 'Space') return;
  event.preventDefault();
  startGame();
});
