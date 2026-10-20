// Fixed zone so date tests cover the German daylight saving change.
module.exports = () => {
  process.env.TZ = 'Europe/Berlin';
};
