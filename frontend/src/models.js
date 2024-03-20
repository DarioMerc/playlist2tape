export class Side {
  constructor(id, tracklist) {
    this.id = id;
    this.tracklist = tracklist;
  }
}
export class Mixtape {
  constructor(sides) {
    this.sides = sides;
  }
  addSide(id, tracklist) {
    const newSide = new Side(id, tracklist);
    this.sides.push(newSide);
  }
}
