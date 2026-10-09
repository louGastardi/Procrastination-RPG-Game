let gameStarted = false;

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

document.addEventListener('keydown', (event) => {
  if (event.code === 'KeyM' && !event.repeat) {
    Sound.toggleMute();
  }
});

function startGame() {
  if (gameStarted) return;
  gameStarted = true;

  //Drop focus so a later Space press does not "click" the hidden button again
  document.getElementById('start-button').blur();

  //The start action is a user gesture, so audio is allowed from here on
  Sound.unlock();
  Sound.startMusic();

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
