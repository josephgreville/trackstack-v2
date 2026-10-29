import { describe, expect, it } from 'vitest';
import { parseCsv } from '../utils/csv.js';

describe('collection CSV import', () => {
  it('reads exported headers, quoted commas, escaped quotes and multiline notes', () => {
    const rows = parseCsv('title,artist,releaseYear,editionNotes\r\n"Blue, Remastered",Joni Mitchell,1971,"First line\nsecond line, with ""quotes"""');
    expect(rows).toEqual([{
      title: 'Blue, Remastered', artist: 'Joni Mitchell', releaseyear: '1971',
      editionnotes: 'First line\nsecond line, with "quotes"',
    }]);
  });

  it('ignores empty rows and supports a header-only file', () => {
    expect(parseCsv('title,artist\n\n')).toEqual([]);
    expect(parseCsv('title,artist')).toEqual([]);
  });
});
