class DirectionInput {
  constructor() {
    //RESPONSENESS OF KEYDOWN
    this.heldDirections = [];
    this.map = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
    };
  }

  get direction() {
    return this.heldDirections[0];
  }

  start() {
    this.keydownFunction = (event) => {
      const direction = this.map[event.code];

      //RESPONSENESS OF KEYDOWN
      if (direction && this.heldDirections.indexOf(direction) === -1) {
        this.heldDirections.unshift(direction);
      }
    };

    this.keyupFunction = (event) => {
      const direction = this.map[event.code];
      const index = this.heldDirections.indexOf(direction);

      //RESPONSENESS OF KEYUP
      if (index > -1) {
        this.heldDirections.splice(index, 1);
      }
    };

    document.addEventListener('keydown', this.keydownFunction);
    document.addEventListener('keyup', this.keyupFunction);
  }

  //Remove the listeners when the game is over
  stop() {
    document.removeEventListener('keydown', this.keydownFunction);
    document.removeEventListener('keyup', this.keyupFunction);
    this.heldDirections = [];
  }
}
