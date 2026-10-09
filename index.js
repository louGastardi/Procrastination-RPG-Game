// ---------- Screens ----------
const startSection = document.querySelector('.start');
const gameSection = document.querySelector('.all-elements');
const endSection = document.querySelector('.game-end');
const endMessage = document.getElementById('end-message');

const END_MESSAGES = {
  win: 'Great, you finished all your tasks! Now how about doing them in real life?',
  midnight: "It's midnight! How about solving some real-life tasks now?",
};

//'start', 'game' or 'end'
let screen = 'start';
//The end screen ignores keys for a moment, so a late Space press does not restart by accident
let endScreenReady = false;
let overworld = null;

// ---------- Sound and mute button ----------
const muteButton = document.getElementById('mute-button');

function showMuteState(muted) {
  muteButton.setAttribute('aria-pressed', muted ? 'true' : 'false');
  const label = muted ? 'Unmute sound (M)' : 'Mute sound (M)';
  muteButton.setAttribute('aria-label', label);
  muteButton.title = label;
}

showMuteState(Sound.loadMuted());
document.addEventListener('SoundMuteChange', (e) => showMuteState(e.detail.muted));

//Keep focus off the button, otherwise Space in the game would press it
muteButton.addEventListener('mousedown', (e) => e.preventDefault());
muteButton.addEventListener('click', () => {
  Sound.toggleMute();
  muteButton.blur();
});

// ---------- Game flow ----------

//Starts the first game and every new game after "Play again"
function startGame() {
  if (screen === 'game') return;
  screen = 'game';
  endScreenReady = false;

  //Drop focus so a later Space press does not "click" a hidden button
  document.activeElement && document.activeElement.blur();

  //Clean up the last game: timers, loops, key listeners
  if (overworld) {
    overworld.destroy();
  }

  //Reset the to-do list and the clock
  document.querySelectorAll('.todo-list li').forEach((li) => li.classList.remove('addCheck'));
  document.getElementById('clock').innerHTML = '08:00';

  startSection.style.display = 'none';
  endSection.style.display = 'none';
  endSection.classList.remove('is-visible');
  gameSection.style.display = 'grid';

  //The start action is a user gesture, so audio is allowed from here on
  Sound.unlock();
  Sound.startMusic();

  overworld = new Overworld({
    element: document.querySelector('.game-container'),
    onEnd: showEndScreen,
  });

  overworld.start();
}

function showEndScreen(result) {
  screen = 'end';
  //Release the finished game's key listeners right away
  overworld.destroy();
  endMessage.textContent = END_MESSAGES[result] || END_MESSAGES.win;
  gameSection.style.display = 'none';
  endSection.style.display = 'flex';
  endSection.classList.add('is-visible');
  setTimeout(() => {
    endScreenReady = true;
  }, 500);
}

document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('restart-button').addEventListener('click', () => {
  if (endScreenReady) startGame();
});

// Space on the start screen does the same as the "Let's go!" button, and Space
// or Enter on the end screen does the same as "Play again". The intro message
// binds its own Space listener while this keydown is being dispatched, and
// listeners added during dispatch do not see that same event, so this press
// does not skip the first message.
document.addEventListener('keydown', (event) => {
  if (event.repeat) return;

  if (event.code === 'KeyM') {
    Sound.toggleMute();
    return;
  }

  const isStartKey = event.code === 'Space' || (screen === 'end' && event.code === 'Enter');
  if (!isStartKey) return;

  if (screen === 'start' || (screen === 'end' && endScreenReady)) {
    event.preventDefault();
    startGame();
  }
});
