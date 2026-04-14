const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export const encodeGeohash = (
  latitude: number,
  longitude: number,
  precision = 9
): string => {
  let latRange: [number, number] = [-90, 90];
  let lngRange: [number, number] = [-180, 180];
  let hash = '';
  let bit = 0;
  let ch = 0;
  let isEvenBit = true;

  while (hash.length < precision) {
    if (isEvenBit) {
      const mid = (lngRange[0] + lngRange[1]) / 2;
      if (longitude >= mid) {
        ch = (ch << 1) | 1;
        lngRange = [mid, lngRange[1]];
      } else {
        ch = ch << 1;
        lngRange = [lngRange[0], mid];
      }
    } else {
      const mid = (latRange[0] + latRange[1]) / 2;
      if (latitude >= mid) {
        ch = (ch << 1) | 1;
        latRange = [mid, latRange[1]];
      } else {
        ch = ch << 1;
        latRange = [latRange[0], mid];
      }
    }

    isEvenBit = !isEvenBit;

    if (bit < 4) {
      bit += 1;
    } else {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return hash;
};

