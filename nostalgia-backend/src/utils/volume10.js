function clamp(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

function vol10To100(level) {
  const l = clamp(level, 1, 10);
  return l * 10;
}

function vol100To10(vol) {
  const v = clamp(vol, 0, 100);
  // convert to 1..10; anything <=0 becomes 1 for UI consistency
  const lvl = Math.round(v / 10);
  return Math.max(1, Math.min(10, lvl));
}

module.exports = { vol10To100, vol100To10 };
