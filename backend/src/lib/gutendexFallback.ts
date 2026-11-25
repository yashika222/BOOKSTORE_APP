import type { GutendexApiResponse, GutendexBook } from '@/types';

export const OFFLINE_GUTENDEX_BOOKS: GutendexBook[] = [
  {
    id: 11,
    title: "Alice's Adventures in Wonderland",
    authors: [{ name: 'Lewis Carroll' }],
    subjects: ['Classics', 'Fantasy', "Children's fiction"],
    languages: ['en'],
    formats: {
      'text/html': 'https://www.gutenberg.org/ebooks/11.html.images',
      'application/epub+zip': 'https://www.gutenberg.org/ebooks/11.epub.images',
      'text/plain; charset=us-ascii': 'https://www.gutenberg.org/ebooks/11.txt.utf-8',
    },
    download_count: 0,
  },
  {
    id: 43,
    title: 'The Strange Case of Dr. Jekyll and Mr. Hyde',
    authors: [{ name: 'Robert Louis Stevenson' }],
    subjects: ['Classics', 'Horror', 'Psychological fiction'],
    languages: ['en'],
    formats: {
      'text/html': 'https://www.gutenberg.org/ebooks/43.html.images',
      'application/epub+zip': 'https://www.gutenberg.org/ebooks/43.epub.images',
      'text/plain; charset=us-ascii': 'https://www.gutenberg.org/ebooks/43.txt.utf-8',
    },
    download_count: 0,
  },
  {
    id: 74,
    title: 'The Adventures of Tom Sawyer',
    authors: [{ name: 'Mark Twain' }],
    subjects: ['Classics', 'Adventure stories', "Children's fiction"],
    languages: ['en'],
    formats: {
      'text/html': 'https://www.gutenberg.org/ebooks/74.html.images',
      'application/epub+zip': 'https://www.gutenberg.org/ebooks/74.epub.images',
      'text/plain; charset=us-ascii': 'https://www.gutenberg.org/ebooks/74.txt.utf-8',
    },
    download_count: 0,
  },
  {
    id: 84,
    title: 'Frankenstein; Or, The Modern Prometheus',
    authors: [{ name: 'Mary Wollstonecraft Shelley' }],
    subjects: ['Classics', 'Horror', 'Science fiction', 'Gothic fiction'],
    languages: ['en'],
    formats: {
      'text/html': 'https://www.gutenberg.org/ebooks/84.html.images',
      'application/epub+zip': 'https://www.gutenberg.org/ebooks/84.epub.images',
      'text/plain; charset=us-ascii': 'https://www.gutenberg.org/ebooks/84.txt.utf-8',
    },
    download_count: 0,
  },
  {
    id: 98,
    title: 'A Tale of Two Cities',
    authors: [{ name: 'Charles Dickens' }],
    subjects: ['Classics', 'Historical fiction', 'French fiction'],
    languages: ['en'],
    formats: {
      'text/html': 'https://www.gutenberg.org/ebooks/98.html.images',
      'application/epub+zip': 'https://www.gutenberg.org/ebooks/98.epub.images',
      'text/plain; charset=us-ascii': 'https://www.gutenberg.org/ebooks/98.txt.utf-8',
    },
    download_count: 0,
  },
  {
    id: 345,
    title: 'Dracula',
    authors: [{ name: 'Bram Stoker' }],
    subjects: ['Classics', 'Horror', 'Vampires', 'Gothic fiction'],
    languages: ['en'],
    formats: {
      'text/html': 'https://www.gutenberg.org/ebooks/345.html.images',
      'application/epub+zip': 'https://www.gutenberg.org/ebooks/345.epub.images',
      'text/plain; charset=us-ascii': 'https://www.gutenberg.org/ebooks/345.txt.utf-8',
    },
    download_count: 0,
  },
  {
    id: 1260,
    title: 'Jane Eyre: An Autobiography',
    authors: [{ name: 'Charlotte Bronte' }],
    subjects: ['Classics', 'Romance fiction', 'Bildungsromans'],
    languages: ['en'],
    formats: {
      'text/html': 'https://www.gutenberg.org/ebooks/1260.html.images',
      'application/epub+zip': 'https://www.gutenberg.org/ebooks/1260.epub.images',
      'text/plain; charset=us-ascii': 'https://www.gutenberg.org/ebooks/1260.txt.utf-8',
    },
    download_count: 0,
  },
  {
    id: 1342,
    title: 'Pride and Prejudice',
    authors: [{ name: 'Jane Austen' }],
    subjects: ['Classics', 'Romance fiction', 'English fiction'],
    languages: ['en'],
    formats: {
      'text/html': 'https://www.gutenberg.org/ebooks/1342.html.images',
      'application/epub+zip': 'https://www.gutenberg.org/ebooks/1342.epub.images',
      'text/plain; charset=us-ascii': 'https://www.gutenberg.org/ebooks/1342.txt.utf-8',
    },
    download_count: 0,
  },
  {
    id: 1661,
    title: 'The Adventures of Sherlock Holmes',
    authors: [{ name: 'Arthur Conan Doyle' }],
    subjects: ['Classics', 'Detective and mystery stories'],
    languages: ['en'],
    formats: {
      'text/html': 'https://www.gutenberg.org/ebooks/1661.html.images',
      'application/epub+zip': 'https://www.gutenberg.org/ebooks/1661.epub.images',
      'text/plain; charset=us-ascii': 'https://www.gutenberg.org/ebooks/1661.txt.utf-8',
    },
    download_count: 0,
  },
  {
    id: 2701,
    title: 'Moby Dick; Or, The Whale',
    authors: [{ name: 'Herman Melville' }],
    subjects: ['Classics', 'Sea stories', 'Whales'],
    languages: ['en'],
    formats: {
      'text/html': 'https://www.gutenberg.org/ebooks/2701.html.images',
      'application/epub+zip': 'https://www.gutenberg.org/ebooks/2701.epub.images',
      'text/plain; charset=us-ascii': 'https://www.gutenberg.org/ebooks/2701.txt.utf-8',
    },
    download_count: 0,
  },
  {
    id: 64317,
    title: 'The Great Gatsby',
    authors: [{ name: 'F. Scott Fitzgerald' }],
    subjects: ['Classics', 'Social history', 'Psychological fiction'],
    languages: ['en'],
    formats: {
      'text/html': 'https://www.gutenberg.org/ebooks/64317.html.images',
      'application/epub+zip': 'https://www.gutenberg.org/ebooks/64317.epub.images',
      'text/plain; charset=us-ascii': 'https://www.gutenberg.org/ebooks/64317.txt.utf-8',
    },
    download_count: 0,
  },
];

export function getOfflineGutendexBook(url: URL): GutendexBook | null {
  const bookId = url.pathname.match(/^\/books\/(\d+)\/?$/)?.[1];
  if (!bookId) return null;
  return OFFLINE_GUTENDEX_BOOKS.find((book) => book.id === Number(bookId)) || null;
}

export function getOfflineGutendexResponse(url: URL): GutendexApiResponse & {
  offlineFallback: true;
} {

  const search = (url.searchParams.get('search') || '').trim().toLowerCase();
  const topics = (url.searchParams.get('topic') || '')
    .split(',')
    .map((topic) => topic.trim().toLowerCase())
    .filter(Boolean);

  const books = OFFLINE_GUTENDEX_BOOKS.filter((book) => {
    const searchableText = [
      book.title,
      ...book.authors.map((author) => author.name),
      ...book.subjects,
    ]
      .join(' ')
      .toLowerCase();
    const matchesSearch =
      !search ||
      search === 'classic' ||
      search === 'classics' ||
      searchableText.includes(search);
    const matchesTopic =
      topics.length === 0 ||
      topics.some((topic) => searchableText.includes(topic));

    return matchesSearch && matchesTopic;
  });

  return {
    count: books.length,
    next: null,
    previous: null,
    results: books,
    offlineFallback: true,
  };
}
