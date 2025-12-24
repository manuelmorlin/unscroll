/**
 * Script to populate betta&manu account with 14 films in watchlist
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const BETTA_UID = 'PyIpCkd0IlO3uASpfLjabiJld762';

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

// 14 films for betta&manu watchlist
const FILMS = [
  {
    title: "Bugonia",
    year: 2025,
    genre: "Comedy/Sci-Fi",
    director: "Yorgos Lanthimos",
    duration: null,
    plot: "Two conspiracy theorists attempt to prove that a prominent businesswoman is actually an alien determined to destroy Earth.",
    cast: ["Emma Stone", "Jesse Plemons"],
    poster_url: "https://image.tmdb.org/t/p/w500/dZbLqRjjiiNCpTYzhzL2deaHXGE.jpg",
    original_language: "en",
  },
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
  },
  {
    title: "The Imitation Game",
    year: 2014,
    genre: "Biography/Drama/Thriller",
    director: "Morten Tyldum",
    duration: "114",
    plot: "During World War II, the English mathematical genius Alan Turing tries to crack the German Enigma code with help from fellow mathematicians.",
    cast: ["Benedict Cumberbatch", "Keira Knightley", "Matthew Goode"],
    poster_url: "https://image.tmdb.org/t/p/w500/zSqJ1qFq8NXFfi7JeIYMlzyR0dx.jpg",
    original_language: "en",
  },
  {
    title: "Coco",
    year: 2017,
    genre: "Animation/Adventure/Drama",
    director: "Lee Unkrich",
    duration: "105",
    plot: "Aspiring musician Miguel, confronted with his family's ancestral ban on music, enters the Land of the Dead to find his great-great-grandfather, a legendary singer.",
    cast: ["Anthony Gonzalez", "Gael García Bernal", "Benjamin Bratt"],
    poster_url: "https://image.tmdb.org/t/p/w500/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg",
    original_language: "en",
  },
  {
    title: "The Pianist",
    year: 2002,
    genre: "Biography/Drama/Music",
    director: "Roman Polanski",
    duration: "150",
    plot: "A Polish Jewish musician struggles to survive the destruction of the Warsaw ghetto of World War II.",
    cast: ["Adrien Brody", "Emilia Fox", "Michal Zebrowski", "Thomas Kretschmann"],
    poster_url: "https://image.tmdb.org/t/p/w500/2hFvxCCWrTmCYwfy7yum0GKRi3Y.jpg",
    original_language: "en",
  },
  {
    title: "The Lobster",
    year: 2015,
    genre: "Comedy/Drama/Romance",
    director: "Yorgos Lanthimos",
    duration: "119",
    plot: "In a dystopian near future, single people, according to the laws of The City, are taken to The Hotel, where they are obliged to find a romantic partner in forty-five days or are transformed into beasts.",
    cast: ["Colin Farrell", "Rachel Weisz", "Léa Seydoux", "John C. Reilly"],
    poster_url: "https://image.tmdb.org/t/p/w500/7Y9ILV1unpW9mLpGcqyGQU72LUy.jpg",
    original_language: "en",
  },
  {
    title: "Notting Hill",
    year: 1999,
    genre: "Comedy/Drama/Romance",
    director: "Roger Michell",
    duration: "124",
    plot: "The life of a simple bookshop owner changes when he meets the most famous film star in the world.",
    cast: ["Julia Roberts", "Hugh Grant", "Rhys Ifans", "Emma Chambers"],
    poster_url: "https://image.tmdb.org/t/p/w500/j5F7NP0T2ViTxT7SaOZQd7TStAw.jpg",
    original_language: "en",
  },
  {
    title: "Your Name",
    year: 2016,
    genre: "Animation/Drama/Fantasy",
    director: "Makoto Shinkai",
    duration: "106",
    plot: "Two strangers find themselves linked in a bizarre way. When a connection forms, will distance be the only thing to keep them apart?",
    cast: ["Ryunosuke Kamiki", "Mone Kamishiraishi"],
    poster_url: "https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg",
    original_language: "ja",
  },
  {
    title: "The Great Gatsby",
    year: 2013,
    genre: "Drama/Romance",
    director: "Baz Luhrmann",
    duration: "143",
    plot: "A writer and wall street trader, Nick, finds himself drawn to the past and lifestyle of his millionaire neighbor, Jay Gatsby.",
    cast: ["Leonardo DiCaprio", "Tobey Maguire", "Carey Mulligan", "Joel Edgerton"],
    poster_url: "https://image.tmdb.org/t/p/w500/tyxfCBsLp7HjT5X6UyGBWsmG2nB.jpg",
    original_language: "en",
  },
  {
    title: "Me Before You",
    year: 2016,
    genre: "Drama/Romance",
    director: "Thea Sharrock",
    duration: "106",
    plot: "A girl in a small town forms an unlikely bond with a recently-paralyzed man she's taking care of.",
    cast: ["Emilia Clarke", "Sam Claflin", "Janet McTeer", "Charles Dance"],
    poster_url: "https://image.tmdb.org/t/p/w500/bLEU6QBEY2Vlrhj6lZWF1qfXI0g.jpg",
    original_language: "en",
  },
  {
    title: "Rent",
    year: 2005,
    genre: "Drama/Musical/Romance",
    director: "Chris Columbus",
    duration: "135",
    plot: "This is the film version of the Pulitzer and Tony Award winning musical about Bohemians in the East Village of New York City struggling with life, love and AIDS.",
    cast: ["Rosario Dawson", "Taye Diggs", "Wilson Jermaine Heredia", "Jesse L. Martin"],
    poster_url: "https://image.tmdb.org/t/p/w500/uvIGuoThUrLjCMoFPuv1ywXrlNg.jpg",
    original_language: "en",
  },
  {
    title: "Hamilton",
    year: 2020,
    genre: "Biography/Drama/History",
    director: "Thomas Kail",
    duration: "160",
    plot: "The real life of one of America's foremost founding fathers and first Secretary of the Treasury, Alexander Hamilton. Captured live on Broadway from the Richard Rodgers Theater.",
    cast: ["Lin-Manuel Miranda", "Daveed Diggs", "Renée Elise Goldsberry", "Leslie Odom Jr."],
    poster_url: "https://image.tmdb.org/t/p/w500/h1B7tW0t399VDjAcWJh8m87469b.jpg",
    original_language: "en",
  },
  {
    title: "The Da Vinci Code",
    year: 2006,
    genre: "Mystery/Thriller",
    director: "Ron Howard",
    duration: "149",
    plot: "A murder inside the Louvre, and clues in Da Vinci paintings, lead to the discovery of a religious mystery protected by a secret society for two thousand years.",
    cast: ["Tom Hanks", "Audrey Tautou", "Ian McKellen", "Jean Reno"],
    poster_url: "https://image.tmdb.org/t/p/w500/mGNQDzUGVVOEzETw30R9VYMAOrs.jpg",
    original_language: "en",
  },
  {
    title: "Joseph: King of Dreams",
    year: 2000,
    genre: "Animation/Drama/Family",
    director: "Rob LaDuca, Robert C. Ramirez",
    duration: "75",
    plot: "This animated classic tells the story of Joseph, who was given a beautiful coat by his father, but sold into slavery by his jealous brothers.",
    cast: ["Ben Affleck", "Mark Hamill", "Richard Herd"],
    poster_url: "https://image.tmdb.org/t/p/w500/aYGTYPi3yAqPkm1B8J3GE1B0sC0.jpg",
    original_language: "en",
  },
];

async function populateBetta() {
  try {
    console.log('🎬 Populating betta&manu account with films...\n');
    
    const userRef = db.collection('users').doc(BETTA_UID);
    
    // Add films to watchlist
    console.log('Adding films to watchlist...');
    
    for (const film of FILMS) {
      const filmData = {
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
        status: 'unwatched',
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      };
      
      await userRef.collection('watchlist').add(filmData);
      console.log(`  ✓ ${film.title} (${film.year})`);
    }
    
    console.log(`\n✅ betta&manu account populated!`);
    console.log(`   📋 Watchlist: ${FILMS.length} films (To Watch)`);
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

populateBetta();
