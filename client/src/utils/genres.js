export const GENRES = [
  { name: 'Rock', tone: 'rust', note: 'Loud, loose & timeless' },
  { name: 'Pop', tone: 'rose', note: 'Hooks that stay with you' },
  { name: 'Hip-Hop/Rap', tone: 'gold', note: 'Beats, bars & stories' },
  { name: 'Electronic', tone: 'sage', note: 'Synthetic worlds' },
  { name: 'Jazz', tone: 'olive', note: 'After-hours standards' },
  { name: 'R&B/Soul', tone: 'rose', note: 'Deep grooves & feeling' },
  { name: 'Indie', tone: 'sage', note: 'Left-of-centre favourites' },
  { name: 'Country', tone: 'gold', note: 'Front-porch songwriting' },
];

export function genreByName(name) {
  return GENRES.find((genre) => genre.name.toLowerCase() === String(name).toLowerCase());
}
