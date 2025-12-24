/**
 * Script to populate demo account with sample films
 * Uses the correct media_items collection structure
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const DEMO_UID = 'HUMNmKkJ7VcsCRNRbw0DD3yXdgq1';

const getPrivateKey = () => {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) return undefined;
  return key.includes('\\n') ? key.replace(/\\n/g, '\n') : key;
};

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: getPrivateKey(),
};

const app = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(app);

// Films to add - mix of classics and modern
const FILMS = [
  // WATCHLIST (5 films - to watch)
  {
    title: "Oppenheimer",
    year: 2023,
    genre: "Biography/Drama/History",
    director: "Christopher Nolan",
    duration: "180",
    plot: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
    cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon", "Robert Downey Jr.", "Florence Pugh"],
    poster_url: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    original_language: "en",
    status: "unwatched",
  },
  {
    title: "Poor Things",
    year: 2023,
    genre: "Comedy/Drama/Romance",
    director: "Yorgos Lanthimos",
    duration: "141",
    plot: "The incredible tale about the fantastical evolution of Bella Baxter, a young woman brought back to life by the brilliant and unorthodox scientist Dr. Godwin Baxter.",
    cast: ["Emma Stone", "Mark Ruffalo", "Willem Dafoe"],
    poster_url: "https://image.tmdb.org/t/p/w500/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg",
    original_language: "en",
    status: "unwatched",
  },
  {
    title: "Dune: Part Two",
    year: 2024,
    genre: "Sci-Fi/Adventure/Drama",
    director: "Denis Villeneuve",
    duration: "166",
    plot: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
    cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Josh Brolin"],
    poster_url: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    original_language: "en",
    status: "unwatched",
  },
  {
    title: "The Zone of Interest",
    year: 2023,
    genre: "Drama/History/War",
    director: "Jonathan Glazer",
    duration: "105",
    plot: "The commandant of Auschwitz, Rudolf Höss, and his wife Hedwig, strive to build a dream life for their family in a house and garden next to the camp.",
    cast: ["Christian Friedel", "Sandra Hüller"],
    poster_url: "https://image.tmdb.org/t/p/w500/hUu9zyZmDd8VZegKi1iK1Vk0RYS.jpg",
    original_language: "en",
    status: "unwatched",
  },
  {
    title: "Challengers",
    year: 2024,
    genre: "Drama/Romance/Sport",
    director: "Luca Guadagnino",
    duration: "131",
    plot: "Tennis player turned coach Tashi has taken her husband, Art, and transformed him into a Grand Slam champion.",
    cast: ["Zendaya", "Josh O'Connor", "Mike Faist"],
    poster_url: "https://image.tmdb.org/t/p/w500/H6vke7zGiuLsz4v4RPhaQJwS8SJ.jpg",
    original_language: "en",
    status: "unwatched",
  },

  // DIARY (15 films - watched with ratings and some reviews)
  {
    title: "Parasite",
    year: 2019,
    genre: "Thriller/Drama/Comedy",
    director: "Bong Joon-ho",
    duration: "132",
    plot: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
    cast: ["Song Kang-ho", "Lee Sun-kyun", "Cho Yeo-jeong", "Choi Woo-shik", "Park So-dam"],
    poster_url: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    original_language: "ko",
    status: "watched",
    user_rating: 5,
    user_review: "A masterpiece of social commentary wrapped in a thrilling narrative. Bong Joon-ho crafts every scene with surgical precision.",
    watched_at: "2024-11-15",
    rewatch_count: 1,
  },
  {
    title: "The Godfather",
    year: 1972,
    genre: "Crime/Drama",
    director: "Francis Ford Coppola",
    duration: "175",
    plot: "The aging patriarch of an organized crime dynasty in postwar New York City transfers control of his clandestine empire to his reluctant youngest son.",
    cast: ["Marlon Brando", "Al Pacino", "James Caan", "Diane Keaton"],
    poster_url: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    original_language: "en",
    status: "watched",
    user_rating: 5,
    user_review: "The definitive crime saga. Every frame is a painting, every line of dialogue iconic.",
    watched_at: "2024-08-20",
    rewatch_count: 2,
  },
  {
    title: "Pulp Fiction",
    year: 1994,
    genre: "Crime/Drama",
    director: "Quentin Tarantino",
    duration: "154",
    plot: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
    cast: ["John Travolta", "Uma Thurman", "Samuel L. Jackson", "Bruce Willis"],
    poster_url: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    original_language: "en",
    status: "watched",
    user_rating: 5,
    watched_at: "2024-10-05",
  },
  {
    title: "Inception",
    year: 2010,
    genre: "Sci-Fi/Action/Thriller",
    director: "Christopher Nolan",
    duration: "148",
    plot: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page", "Tom Hardy"],
    poster_url: "https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg",
    original_language: "en",
    status: "watched",
    user_rating: 5,
    user_review: "Mind-bending sci-fi at its finest. The rotating hallway fight remains one of cinema's greatest achievements.",
    watched_at: "2024-07-10",
    rewatch_count: 1,
  },
  {
    title: "Spirited Away",
    year: 2001,
    genre: "Animation/Fantasy/Adventure",
    director: "Hayao Miyazaki",
    duration: "125",
    plot: "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches and spirits.",
    cast: ["Rumi Hiiragi", "Miyu Irino", "Mari Natsuki"],
    poster_url: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
    original_language: "ja",
    status: "watched",
    user_rating: 5,
    watched_at: "2024-12-01",
  },
  {
    title: "The Dark Knight",
    year: 2008,
    genre: "Action/Crime/Drama",
    director: "Christopher Nolan",
    duration: "152",
    plot: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart", "Michael Caine"],
    poster_url: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    original_language: "en",
    status: "watched",
    user_rating: 5,
    user_review: "Heath Ledger's Joker transcends the superhero genre. A dark, operatic masterpiece.",
    watched_at: "2024-06-15",
  },
  {
    title: "Whiplash",
    year: 2014,
    genre: "Drama/Music",
    director: "Damien Chazelle",
    duration: "106",
    plot: "A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing to realize a student's potential.",
    cast: ["Miles Teller", "J.K. Simmons"],
    poster_url: "https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg",
    original_language: "en",
    status: "watched",
    user_rating: 5,
    watched_at: "2024-09-22",
  },
  {
    title: "La La Land",
    year: 2016,
    genre: "Comedy/Drama/Music",
    director: "Damien Chazelle",
    duration: "128",
    plot: "While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.",
    cast: ["Ryan Gosling", "Emma Stone"],
    poster_url: "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg",
    original_language: "en",
    status: "watched",
    user_rating: 4,
    user_review: "A beautiful love letter to dreamers and the city of stars. The ending still haunts me.",
    watched_at: "2024-02-14",
  },
  {
    title: "Get Out",
    year: 2017,
    genre: "Horror/Mystery/Thriller",
    director: "Jordan Peele",
    duration: "104",
    plot: "A young African-American visits his white girlfriend's parents for the weekend, where his simmering uneasiness about their reception of him eventually reaches a boiling point.",
    cast: ["Daniel Kaluuya", "Allison Williams", "Bradley Whitford", "Catherine Keener"],
    poster_url: "https://image.tmdb.org/t/p/w500/qbav3GuTfyR4ynPNTmGGCAh3n8.jpg",
    original_language: "en",
    status: "watched",
    user_rating: 4,
    watched_at: "2024-10-31",
  },
  {
    title: "The Grand Budapest Hotel",
    year: 2014,
    genre: "Adventure/Comedy/Crime",
    director: "Wes Anderson",
    duration: "99",
    plot: "A writer encounters the owner of an aging high-class hotel, who tells him of his early years serving as a lobby boy in the hotel's glorious years under an exceptional concierge.",
    cast: ["Ralph Fiennes", "Tony Revolori", "F. Murray Abraham", "Saoirse Ronan"],
    poster_url: "https://image.tmdb.org/t/p/w500/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg",
    original_language: "en",
    status: "watched",
    user_rating: 4,
    watched_at: "2024-05-10",
  },
  {
    title: "Blade Runner 2049",
    year: 2017,
    genre: "Sci-Fi/Drama",
    director: "Denis Villeneuve",
    duration: "164",
    plot: "Young Blade Runner K's discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who's been missing for thirty years.",
    cast: ["Ryan Gosling", "Harrison Ford", "Ana de Armas", "Jared Leto"],
    poster_url: "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
    original_language: "en",
    status: "watched",
    user_rating: 5,
    user_review: "A rare sequel that honors its predecessor while carving its own philosophical depth. Visually transcendent.",
    watched_at: "2024-04-18",
  },
  {
    title: "Everything Everywhere All at Once",
    year: 2022,
    genre: "Action/Adventure/Comedy",
    director: "Daniel Kwan, Daniel Scheinert",
    duration: "139",
    plot: "A middle-aged Chinese immigrant is swept up in an insane adventure in which she alone can save existence by exploring other universes and connecting with the lives she could have led.",
    cast: ["Michelle Yeoh", "Stephanie Hsu", "Ke Huy Quan", "Jamie Lee Curtis"],
    poster_url: "https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg",
    original_language: "en",
    status: "watched",
    user_rating: 5,
    watched_at: "2024-03-25",
  },
  {
    title: "Interstellar",
    year: 2014,
    genre: "Sci-Fi/Adventure/Drama",
    director: "Christopher Nolan",
    duration: "169",
    plot: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine"],
    poster_url: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    original_language: "en",
    status: "watched",
    user_rating: 5,
    user_review: "An emotional odyssey through space and time. The docking scene is pure cinema magic.",
    watched_at: "2024-01-08",
    rewatch_count: 2,
  },
  {
    title: "The Shawshank Redemption",
    year: 1994,
    genre: "Drama",
    director: "Frank Darabont",
    duration: "142",
    plot: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
    cast: ["Tim Robbins", "Morgan Freeman", "Bob Gunton"],
    poster_url: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    original_language: "en",
    status: "watched",
    user_rating: 5,
    watched_at: "2024-08-01",
  },
  {
    title: "Amélie",
    year: 2001,
    genre: "Comedy/Romance",
    director: "Jean-Pierre Jeunet",
    duration: "122",
    plot: "Amélie is an innocent and naive girl in Paris with her own sense of justice. She decides to help those around her and discovers love along the way.",
    cast: ["Audrey Tautou", "Mathieu Kassovitz"],
    poster_url: "https://image.tmdb.org/t/p/w500/nSxDa3ppafARTlgftpVgJrc3ril.jpg",
    original_language: "fr",
    status: "watched",
    user_rating: 4,
    user_review: "Pure whimsy and charm. Paris has never looked more magical.",
    watched_at: "2024-09-14",
  },
];

async function populateDemo() {
  try {
    console.log('🎬 Populating demo account with films...\n');
    console.log(`Using user_id: ${DEMO_UID}\n`);
    
    // First, clear existing demo data from media_items collection
    console.log('Clearing existing demo data...');
    const existingItems = await db.collection('media_items')
      .where('user_id', '==', DEMO_UID)
      .get();
    
    if (existingItems.docs.length > 0) {
      const batch = db.batch();
      existingItems.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`  Deleted ${existingItems.docs.length} existing items from media_items`);
    }
    
    // Also clear old subcollection data if any exists
    const oldWatchlist = await db.collection('users').doc(DEMO_UID).collection('watchlist').get();
    const oldDiary = await db.collection('users').doc(DEMO_UID).collection('diary').get();
    
    if (oldWatchlist.docs.length > 0) {
      const batch = db.batch();
      oldWatchlist.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`  Cleared ${oldWatchlist.docs.length} from old watchlist subcollection`);
    }
    
    if (oldDiary.docs.length > 0) {
      const batch = db.batch();
      oldDiary.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`  Cleared ${oldDiary.docs.length} from old diary subcollection`);
    }
    
    // Add films to media_items collection
    console.log('\nAdding films to media_items collection...');
    let watchlistCount = 0;
    let diaryCount = 0;
    
    for (const film of FILMS) {
      const docRef = db.collection('media_items').doc();
      const now = new Date().toISOString();
      
      const mediaItem: Record<string, unknown> = {
        id: docRef.id,
        user_id: DEMO_UID,
        title: film.title,
        year: film.year,
        genre: film.genre,
        director: film.director,
        duration: film.duration,
        plot: film.plot,
        cast: film.cast,
        poster_url: film.poster_url,
        original_language: film.original_language,
        format: 'movie',
        status: film.status,
        created_at: now,
        updated_at: now,
      };
      
      if (film.status === 'watched') {
        mediaItem.user_rating = film.user_rating;
        if (film.user_review) {
          mediaItem.user_review = film.user_review;
        }
        if (film.watched_at) {
          mediaItem.watched_at = film.watched_at;
        }
        if (film.rewatch_count) {
          mediaItem.rewatch_count = film.rewatch_count;
        }
        diaryCount++;
        console.log(`  ✓ ${film.title} (${film.year}) → diary`);
      } else {
        watchlistCount++;
        console.log(`  ✓ ${film.title} (${film.year}) → watchlist`);
      }
      
      await docRef.set(mediaItem);
    }
    
    console.log(`\n✅ Demo account populated!`);
    console.log(`   📋 Watchlist: ${watchlistCount} films`);
    console.log(`   📔 Diary: ${diaryCount} films`);
    console.log(`   ⭐ Films with reviews: ${FILMS.filter(f => f.user_review).length}`);
    console.log(`   🔄 Films with rewatches: ${FILMS.filter(f => f.rewatch_count).length}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

populateDemo();
