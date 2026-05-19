import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './firestore-utils';

const MOCK_MEDIA = [
  // ... (keeping existing mock data)
  {
    title: 'NEON GENESIS',
    description: 'In a dystopian 2026, a group of hackers discovers a secret that could rewrite the fabric of reality.',
    type: 'movie',
    genre: 'Sci-Fi',
    rating: '18+',
    year: 2026,
    posterUrl: 'https://picsum.photos/seed/cyberpunk/400/600',
    backdropUrl: 'https://picsum.photos/seed/cyberpunk/1920/1080',
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    isOriginal: true
  },
  {
    title: 'THE LAST CODE',
    description: 'A programmer finds a bug in the universe that allows him to travel through time.',
    type: 'movie',
    genre: 'Thriller',
    rating: '15+',
    year: 2025,
    posterUrl: 'https://picsum.photos/seed/code/400/600',
    backdropUrl: 'https://picsum.photos/seed/code/1920/1080',
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    isOriginal: false
  },
  {
    title: 'SILICON VALLEY 2.0',
    description: 'The tech giants have fallen. A new era of decentralized power begins.',
    type: 'series',
    genre: 'Drama',
    rating: '12+',
    year: 2026,
    posterUrl: 'https://picsum.photos/seed/tech/400/600',
    backdropUrl: 'https://picsum.photos/seed/tech/1920/1080',
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    isOriginal: true
  }
];

export const seedDatabase = async () => {
  const path = 'media';
  try {
    const querySnapshot = await getDocs(collection(db, path));
    if (querySnapshot.empty) {
      for (const item of MOCK_MEDIA) {
        await addDoc(collection(db, path), item);
      }
      console.log('Database seeded!');
    }
  } catch (error) {
    // Gracefully handle permission errors during seeding
    if (error instanceof Error && error.message.includes('insufficient permissions')) {
      console.warn('Seeding skipped: Missing permissions (Admin only)');
    } else {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
};
