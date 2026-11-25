import { ICommercialBook } from '@/types';
import { SAMPLE_COMMERCIAL_BOOKS } from '@/lib/sampleBooks';

export const CATALOG_TARGET_COUNT = 1000;
export const BOOK_PAGE_SIZE = 20;

const GENRES = [
  'Fiction',
  'Science Fiction',
  'Mystery',
  'Fantasy',
  'History',
  'Science',
  'Philosophy',
  'Poetry',
  'Self-Help',
  'Romance',
  'Thriller',
  'Biography',
  'Adventure',
  'Horror',
  'Classics',
  'Children',
  'Business',
  'Travel',
  'Drama',
  'Art',
];

const AUTHORS = [
  'Elena Voss',
  'Marcus Hale',
  'Priya Raman',
  'Jonah Ellis',
  'Amelia Crowe',
  'Theo Nakamura',
  'Sofia Berg',
  'Daniel Okonkwo',
  'Hannah Quinn',
  'Leo Moreau',
  'Isla Bennett',
  'Omar Farid',
  'Clara Jensen',
  'Felix Ward',
  'Maya Chen',
  'Owen Blake',
  'Nora Patel',
  'Sebastian Ruiz',
  'Ava Lindstrom',
  'Callum Wright',
  'Lina Ortega',
  'Henry Adler',
  'Yuki Tanaka',
  'Rose Gallagher',
  'Ibrahim Hassan',
  'Freya Walsh',
  'Nathan Cole',
  'Sienna Brooks',
  'Victor Lang',
  'Chloe Park',
];

const ADJECTIVES = [
  'Silent',
  'Hidden',
  'Golden',
  'Forgotten',
  'Midnight',
  'Iron',
  'Velvet',
  'Broken',
  'Endless',
  'Northern',
  'Glass',
  'Wild',
  'Ancient',
  'Quiet',
  'Burning',
  'Distant',
  'Silver',
  'Hollow',
  'Bright',
  'Lost',
  'Winter',
  'Crimson',
  'Paper',
  'Secret',
  'Last',
];

const NOUNS = [
  'Garden',
  'River',
  'Library',
  'Horizon',
  'Cartographer',
  'Ember',
  'Archive',
  'Orchard',
  'Lighthouse',
  'Symphony',
  'Passage',
  'Clockmaker',
  'Harbor',
  'Manuscript',
  'Summit',
  'Sparrow',
  'Kingdom',
  'Mirror',
  'Voyage',
  'Lantern',
  'Threshold',
  'Compass',
  'Meadow',
  'Cathedral',
  'Algorithm',
];

const COVERS = [
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=500&q=80',
];

function roundPrice(value: number): number {
  return Math.round(value * 100) / 100;
}

function generatedIsbn(index: number): string {
  const body = `97850${String(index).padStart(7, '0')}`;
  return `${body.slice(0, 3)}-${body.slice(3, 4)}-${body.slice(4, 8)}-${body.slice(8)}`;
}

function generatedTitle(index: number): string {
  const adjective = ADJECTIVES[index % ADJECTIVES.length];
  const noun = NOUNS[(index * 3) % NOUNS.length];
  const extra = NOUNS[(index * 7) % NOUNS.length];
  if (index % 5 === 0) return `The ${adjective} ${noun}`;
  if (index % 5 === 1) return `${adjective} ${noun} of ${extra}s`;
  if (index % 5 === 2) return `${noun} and the ${adjective} ${extra}`;
  if (index % 5 === 3) return `A ${adjective} ${noun}`;
  return `${adjective} ${noun}`;
}

export function buildCatalogBooks(count = CATALOG_TARGET_COUNT): ICommercialBook[] {
  const books: ICommercialBook[] = SAMPLE_COMMERCIAL_BOOKS.map((book, index) => ({
    ...book,
    featured: index < 8,
  }));

  for (let i = books.length + 1; i <= count; i += 1) {
    const genre = GENRES[i % GENRES.length];
    const author = AUTHORS[i % AUTHORS.length];
    const title = generatedTitle(i);
    books.push({
      id: `catalog-${i}`,
      isbn: generatedIsbn(i),
      title,
      author,
      description: `${title} is a ${genre.toLowerCase()} title by ${author}, written for readers who want a complete story with memorable characters and a strong sense of place.`,
      price: roundPrice(8.99 + (i % 37) + (i % 5) * 0.2),
      stock: 4 + (i % 36),
      genre,
      rating: Math.min(5, Math.round((3.6 + (i % 15) * 0.1) * 10) / 10),
      coverImage: COVERS[i % COVERS.length],
      featured: i <= 16,
      publishedYear: 1955 + (i % 70),
    });
  }

  return books;
}
