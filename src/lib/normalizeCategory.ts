const CATEGORY_ALIASES: Record<string, string> = {
  fiction: 'Fiction',
  novel: 'Fiction',
  literature: 'Fiction',
  'science fiction': 'Science Fiction',
  'sci-fi': 'Science Fiction',
  fantasy: 'Fantasy',
  mystery: 'Mystery',
  detective: 'Mystery',
  history: 'History',
  historical: 'History',
  science: 'Science',
  philosophy: 'Philosophy',
  poetry: 'Poetry',
  romance: 'Romance',
  children: 'Children',
  juvenile: 'Children',
  biography: 'Biography',
  drama: 'Drama',
  adventure: 'Adventure',
  horror: 'Horror',
  religion: 'Religion',
};

export function normalizeCategory(subject: string): string | null {
  const key = subject.toLowerCase();
  for (const [needle, label] of Object.entries(CATEGORY_ALIASES)) {
    if (key.includes(needle)) return label;
  }
  return null;
}

export function categoriesFromSubjects(subjects: string[] = []): string[] {
  const set = new Set<string>();
  subjects.forEach((subject) => {
    const category = normalizeCategory(subject);
    if (category) set.add(category);
  });
  return Array.from(set);
}
