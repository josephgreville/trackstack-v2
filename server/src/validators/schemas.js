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
  })
  .strict()
  .refine((value) => value.name !== undefined || value.description !== undefined, {
    message: 'Provide a name or description to update.',
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
});

export const catalogAlbumParamsSchema = z.object({
  externalId: z.string().regex(/^\d{1,20}$/, 'That catalogue identifier is not valid.'),
});

export const albumIdSchema = z.object({ id: uuid });

export const collectionAlbumsQuerySchema = z.object({
  sort: z.enum(['added_at', 'title', 'artist', 'release_year']).optional().default('added_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});
