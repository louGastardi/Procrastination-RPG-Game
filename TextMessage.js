class TextMessage {
  constructor({ text, onComplete }) {
    this.text = text;
    this.onComplete = onComplete;
    this.element = null;
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.classList.add('TextMessage');
    this.element.innerHTML = `
    <p class="TextMessage_p"></p> `;

    //init typewriter effect
    this.revealingText = new RevealingText({
      element: this.element.querySelector('.TextMessage_p'),
      text: this.text,
    });

    // Close Text Message
    this.actionListener = new KeyPressListener('Space', () => {
      this.done();
    });
    TextMessage.open.add(this);
  }

  //Remove the message without finishing it, used when a game is reset
  close() {
    this.revealingText.warpToDone();
    this.element.remove();
    this.actionListener.unbind();
    TextMessage.open.delete(this);
  }

  static closeAll() {
    TextMessage.open.forEach((message) => message.close());
  }

  done() {
    if (this.revealingText.isDone) {
      Sound.blip();
      this.element.remove();
      this.actionListener.unbind();
      TextMessage.open.delete(this);
      this.onComplete();
    } else {
      this.revealingText.warpToDone();
    }
  }

  init(container) {
    this.createElement();
    container.appendChild(this.element);
    this.revealingText.init();
  }
}

//Messages on screen right now
TextMessage.open = new Set();
