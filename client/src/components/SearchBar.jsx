import { useId } from 'react';
import { IconSearch } from './Icons.jsx';

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  genreOptions = [],
  selectedGenre = '',
  onGenreChange,
  placeholder = 'Search albums, artists or a feeling…',
  buttonLabel = 'Search',
  loading = false,
  size = 'md',
  autoFocus = false,
  className = '',
}) {
  const id = useId();

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(value.trim());
  };

  return (
    <form
      className={`search-bar search-bar-${size} ${className}`.trim()}
      role="search"
      onSubmit={handleSubmit}
    >
      <label htmlFor={id} className="sr-only">
        Search the music catalogue
      </label>
      <span className="search-icon" aria-hidden="true">
        <IconSearch size={size === 'lg' ? 21 : 18} />
      </span>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        enterKeyHint="search"
      />
      {genreOptions.length > 0 && (
        <label className="sr-only" htmlFor={`${id}-genre`}>
          Filter by genre
          <select
            id={`${id}-genre`}
            value={selectedGenre?.name ?? selectedGenre ?? ''}
            onChange={(event) => onGenreChange?.(event.target.value)}
          >
            <option value="">All genres</option>
            {genreOptions.map((genre) => (
              <option key={genre.name} value={genre.name}>
                {genre.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <button type="submit" className="search-submit" disabled={loading}>
        {loading ? <span className="spinner" aria-hidden="true" /> : buttonLabel}
      </button>
    </form>
  );
}
