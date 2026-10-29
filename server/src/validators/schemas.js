import { z } from 'zod';

const uuid = z.string().uuid('That identifier is not valid.');
const trimmedText = (min, max, label) =>
  z
    .string({ required_error: `${label} is required.` })
    .trim()
    .min(min, `${label} must be at least ${min} characters.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

export const registerSchema = z
  .object({
    username: trimmedText(2, 40, 'Username').regex(
      /^[a-zA-Z0-9][a-zA-Z0-9 _.-]*$/,
      'Use letters, numbers, spaces, dots, dashes or underscores.',
    ),
    email: z
      .string({ required_error: 'Email is required.' })
      .trim()
      .email('Enter a valid email address.')
      .max(254, 'Email must be 254 characters or fewer.')
      .transform((value) => value.toLowerCase()),
    password: z
      .string({ required_error: 'Password is required.' })
      .min(8, 'Password must be at least 8 characters.')
      .max(128, 'Password must be 128 characters or fewer.'),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().email('Enter a valid email address.').transform((value) => value.toLowerCase()),
    password: z.string().min(1, 'Password is required.').max(128),
  })
  .strict();

export const collectionCreateSchema = z
  .object({
    name: trimmedText(1, 80, 'Collection name'),
    description: z.string().trim().max(500, 'Description must be 500 characters or fewer.').default(''),
  })
  .strict();

export const collectionUpdateSchema = z
  .object({
    name: trimmedText(1, 80, 'Collection name').optional(),
    description: z
      .string()
      .trim()
      .max(500, 'Description must be 500 characters or fewer.')
      .optional(),
    isPublic: z.boolean().optional(),
  })
  .strict()
  .refine((value) => value.name !== undefined || value.description !== undefined || value.isPublic !== undefined, {
    message: 'Provide a collection detail to update.',
  });

export const collectionIdSchema = z.object({ id: uuid });

const manualAlbumSchema = z
  .object({
    title: trimmedText(1, 200, 'Album title'),
    artist: trimmedText(1, 200, 'Artist'),
    releaseYear: z.coerce
      .number()
      .int()
      .min(1000, 'Enter a four-digit year.')
      .max(2100, 'Enter a valid release year.')
      .optional(),
    genre: z.string().trim().max(60).optional().default(''),
    artworkUrl: z.string().trim().url('Artwork must be a valid URL.').max(1000).optional().or(z.literal('')),
  })
  .strict();

export const addAlbumSchema = z.union([
  z.object({ externalId: z.union([z.string(), z.number()]).transform(String).pipe(z.string().regex(/^\d{1,20}$/)) }).strict(),
  z.object({ manual: manualAlbumSchema }).strict(),
]);

export const removeAlbumSchema = z.object({ id: uuid, albumId: uuid });

export const searchQuerySchema = z.object({
  q: z.string().trim().max(120).optional().default(''),
  genre: z.string().trim().max(40).optional().default(''),
  limit: z.coerce.number().int().min(1).max(50).optional().default(24),
  page: z.coerce.number().int().min(1).max(20).optional().default(1),
  artist: z.string().trim().max(120).optional().default(''),
  yearFrom: z.coerce.number().int().min(1000).max(2100).optional(),
  yearTo: z.coerce.number().int().min(1000).max(2100).optional(),
  sort: z.enum(['relevance', 'title', 'artist', 'year']).optional().default('relevance'),
});

export const catalogAlbumParamsSchema = z.object({
  externalId: z.string().regex(/^\d{1,20}$/, 'That catalogue identifier is not valid.'),
});

export const albumIdSchema = z.object({ id: uuid });

export const collectionAlbumsQuerySchema = z.object({
  sort: z.enum(['added_at', 'title', 'artist', 'release_year', 'genre']).optional().default('added_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  q: z.string().trim().max(120).optional().default(''),
});

export const collectionAlbumUpdateSchema = z.object({
  format: z.enum(['vinyl', 'cassette', 'cd', 'digital', 'other']).nullable().optional(),
  condition: z.enum(['mint', 'near_mint', 'very_good', 'good', 'fair', 'poor']).nullable().optional(),
  purchaseDate: z.string().date().nullable().optional(),
  price: z.number().nonnegative().max(99999999).nullable().optional(),
  editionNotes: z.string().trim().max(500).optional(),
  memoryLocation: z.string().trim().max(200).nullable().optional(),
  memoryWith: z.string().trim().max(200).nullable().optional(),
  memoryNote: z.string().trim().max(1000).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, { message: 'Provide a detail to update.' });

export const wantlistCreateSchema = z.object({
  externalId: z.union([z.string(), z.number()]).transform(String).pipe(z.string().regex(/^\d{1,20}$/)),
  preferredEdition: z.string().trim().max(300).optional().default(''),
  notes: z.string().trim().max(500).optional().default(''),
  maxPrice: z.number().nonnegative().max(99999999).nullable().optional(),
}).strict();
export const wantlistUpdateSchema = z.object({
  preferredEdition: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(500).optional(),
  maxPrice: z.number().nonnegative().max(99999999).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, { message: 'Provide a wantlist detail to update.' });
export const wantlistAcquireSchema = z.object({
  collectionId: uuid,
  format: z.enum(['vinyl', 'cassette', 'cd', 'digital', 'other']).optional(),
  purchaseDate: z.string().date().optional(),
  price: z.number().nonnegative().max(99999999).optional(),
}).strict();
export const queueIdSchema = z.object({ id: uuid });
export const queueBuildSchema = z.object({
  genre: z.string().trim().max(60).optional().default(''),
  mood: z.enum(['', 'mellow', 'upbeat', 'energetic', 'reflective', 'focus']).optional().default(''),
}).strict();
export const queueCreateSchema = z.object({ albumId: uuid }).strict();

export const historyCreateSchema = z.object({
  albumId: uuid.optional(),
  externalId: z.union([z.string(), z.number()]).transform(String).pipe(z.string().regex(/^\d{1,20}$/)).optional(),
}).strict().refine((value) => Boolean(value.albumId || value.externalId), { message: 'Choose an album to log.' });

export const historyReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).nullable().optional(),
  review: z.string().trim().max(1000).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, { message: 'Provide a rating or review.' });

export const profileUpdateSchema = z.object({ profilePublic: z.boolean() }).strict();
export const publicProfileParamsSchema = z.object({ username: z.string().min(2).max(40) });
export const shareTokenParamsSchema = z.object({ token: uuid });
export const historyIdParamsSchema = z.object({ historyId: uuid });

export const collectionImportSchema = z.object({
  albums: z.array(z.object({
    title: trimmedText(1, 200, 'Album title'),
    artist: trimmedText(1, 200, 'Artist'),
    releaseYear: z.coerce.number().int().min(1000).max(2100).optional(),
    genre: z.string().trim().max(60).optional().default(''),
    format: z.enum(['vinyl', 'cassette', 'cd', 'digital', 'other']).optional(),
    condition: z.enum(['mint', 'near_mint', 'very_good', 'good', 'fair', 'poor']).optional(),
    purchaseDate: z.string().date().optional(),
    price: z.coerce.number().nonnegative().max(99999999).optional(),
    editionNotes: z.string().trim().max(500).optional().default(''),
    memoryLocation: z.string().trim().max(200).optional().default(''),
    memoryWith: z.string().trim().max(200).optional().default(''),
    memoryNote: z.string().trim().max(1000).optional().default(''),
  }).strict()).max(500),
}).strict();
