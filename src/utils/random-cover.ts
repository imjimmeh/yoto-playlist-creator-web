/**
 * Pick a random element from an array
 * @param arr Array to get a random element from
 * @returns A random element from the array (if the array has any elements), otherwise undefined
 */
export const pickRandomFromArray = <T>(arr: T[]): T | undefined =>
  arr.length == 0 ? undefined : arr[Math.floor(Math.random() * arr.length)];

export const RANDOM_COVER_OBJECTS = [
  "apple",
  "bee",
  "book",
  "cactus",
  "cat-keytar",
  "cherries",
  "cloud",
  "diamond",
  "drum",
  "fish",
  "flower",
  "ghost",
  "ice-cream",
  "lolly",
  "microphone",
  "radio",
  "rocket",
  "skull",
  "star",
  "strawberry",
  "sun",
  "unicorn",
];

export const RANDOM_COVER_COLOURS = [
  "blue",
  "grapefruit",
  "green",
  "lilac",
  "mint",
  "orange",
  "red",
  "yellow",
];

export const pickRandomCoverUrl = (): string => {
  const object = pickRandomFromArray(RANDOM_COVER_OBJECTS);
  const colour = pickRandomFromArray(RANDOM_COVER_COLOURS);
  return `https://cdn.yoto.io/myo-cover/${object}_${colour}.gif`;
};
