/**
 * Seeds for the glyph field, each of which was rolled and looked at before being
 * kept.
 *
 * A fixed list rather than a fresh seed each load. Every seed gives a valid
 * arrangement, but a good half of them are lopsided enough to be worth looking at
 * before shipping, and these are the ones that were: an even crowd, the same
 * wallpaper for everyone playing rather than a different one per visit.
 *
 * One of these per load, so two players are not looking at the same margins, and
 * neither is looking at an arrangement nobody has seen. The list is here rather
 * than in the field itself so a test can hold it to the arrangement it describes.
 */
export const Seeds = [
  530100493, 1180368494, 2399803037, 4018405194, 2738573284, 2862363194, 3964561014, 3749729585,
];