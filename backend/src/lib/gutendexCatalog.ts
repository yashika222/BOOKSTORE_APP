export const FIRST_GUTENDEX_PAGE = 'https://gutendex.com/books/?languages=en';

const TOPIC_ALIASES: Record<string, string> = {
  all: '',
  fiction: 'fiction',
  classics: 'classics',
  classic: 'classics',
  science: 'science',
  history: 'history',
  philosophy: 'philosophy',
  poetry: 'poetry',
  mystery: 'detective',
  fantasy: 'fantasy',
  'sci-fi': 'science fiction',
  scifi: 'science fiction',
  'science fiction': 'science fiction',
  'self-help': 'psychology',
  'self help': 'psychology',
  children: "children's literature",
  'fairy-tales': 'fairy',
  'fairy tales': 'fairy',
  historical: 'historical',
  'non-fiction': 'history',
};

export const SEARCH_SUGGESTIONS = [
  'Pride and Prejudice',
  'Frankenstein',
  'Alice',
  'Jane Austen',
  'Lewis Carroll',
  'Herman Melville',
  'Fiction',
  'Science Fiction',
  'Mystery',
  'History',
  'Science',
  'Fantasy',
];

export function gutendexTopicFromCategory(category: string): string {
  const key = category.trim().toLowerCase();
  if (!key || key === 'all') return '';
  return TOPIC_ALIASES[key] || category.trim();
}

export function isSubjectLikeQuery(query: string): boolean {
  const key = query.trim().toLowerCase();
  return Boolean(key && TOPIC_ALIASES[key]);
}

export function buildGutendexUrl(query: string, genre: string): string {
  const url = new URL(FIRST_GUTENDEX_PAGE);
  const trimmedQuery = query.trim();
  const topicFromGenre = gutendexTopicFromCategory(genre);
  const topicFromQuery = isSubjectLikeQuery(trimmedQuery)
    ? gutendexTopicFromCategory(trimmedQuery)
    : '';

  if (trimmedQuery && !topicFromQuery) {
    url.searchParams.set('search', trimmedQuery);
  }

  const topic = topicFromGenre || topicFromQuery;
  if (topic) {
    url.searchParams.set('topic', topic);
  }

  return url.toString();
}

export function commercialGenreFromCategory(category: string): string {
  const key = category.trim().toLowerCase();
  if (!key || key === 'all') return '';
  if (key === 'sci-fi' || key === 'scifi') return 'science fiction';
  if (key === 'self-help') return 'self-help';
  if (key === 'classics' || key === 'classic') return 'fiction';
  return key;
}
