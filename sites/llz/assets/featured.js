/** Homepage free challenges — rotate by editing `active` or enable autoRotate.
 *  Same trio on homepage + /challenges/; Labs stays the full member board.
 */
window.LADEN_FEATURED = {
  // Which set to show when autoRotate is false
  active: 0,
  // Weekly rotation across these sets (UTC week). Set false to pin `active`.
  autoRotate: true,
  sets: [
    ['scope-first', 'robots-redux', 'reflect-101'],
    ['banner-grab-lite', 'cookie-jar', 'b64-again'],
    ['hidden-dir', 'rot-warm', 'open-redirect'],
  ],
  slugs: function () {
    var sets = this.sets || [];
    if (!sets.length) return [];
    var i = this.active | 0;
    if (this.autoRotate) {
      var week = Math.floor(Date.now() / 86400000 / 7);
      i = week % sets.length;
    }
    if (i < 0 || i >= sets.length) i = 0;
    return sets[i].slice(0, 3);
  }
};
