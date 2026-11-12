/** First letters of the first two words of a name, e.g. "Rina Putri" → "RP". */
export const initialsOf = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
