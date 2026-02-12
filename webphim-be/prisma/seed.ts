import { PrismaClient, ContentType, MaturityRating, CastRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/webphim';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // ============================================
  // BOSS ACCOUNT (CRITICAL - must survive every re-seed)
  // ============================================
  const bossPasswordHash = await bcrypt.hash('Boss@123456', 12);
  await prisma.user.upsert({
    where: { email: 'boss@webphim.com' },
    update: {},
    create: {
      email: 'boss@webphim.com',
      passwordHash: bossPasswordHash,
      name: 'Boss',
    },
  });
  // Set Boss as ADMIN
  await prisma.user.update({
    where: { email: 'boss@webphim.com' },
    data: { role: 'ADMIN' },
  });
  const bossUser = await prisma.user.findUnique({ where: { email: 'boss@webphim.com' } });
  if (bossUser) {
    const existingProfile = await prisma.profile.findFirst({ where: { userId: bossUser.id } });
    if (!existingProfile) {
      await prisma.profile.create({
        data: {
          userId: bossUser.id,
          name: bossUser.name,
          avatarUrl: null,
          isKids: false,
        },
      });
    }
  }
  console.log('Boss account seeded: boss@webphim.com (with default profile)');

  // ============================================
  // GENRES (12+)
  // ============================================
  const genres = await Promise.all(
    [
      { name: 'Action', slug: 'action' },
      { name: 'Comedy', slug: 'comedy' },
      { name: 'Drama', slug: 'drama' },
      { name: 'Horror', slug: 'horror' },
      { name: 'Sci-Fi', slug: 'sci-fi' },
      { name: 'Thriller', slug: 'thriller' },
      { name: 'Romance', slug: 'romance' },
      { name: 'Documentary', slug: 'documentary' },
      { name: 'Animation', slug: 'animation' },
      { name: 'Fantasy', slug: 'fantasy' },
      { name: 'Mystery', slug: 'mystery' },
      { name: 'Crime', slug: 'crime' },
    ].map((g) =>
      prisma.genre.upsert({
        where: { slug: g.slug },
        update: {},
        create: g,
      }),
    ),
  );

  const genreMap = Object.fromEntries(genres.map((g) => [g.slug, g.id]));
  console.log(`Created ${genres.length} genres`);

  // ============================================
  // CAST & CREW (50+)
  // ============================================
  const castData = [
    { name: 'Leonardo DiCaprio' },
    { name: 'Brad Pitt' },
    { name: 'Margot Robbie' },
    { name: 'Scarlett Johansson' },
    { name: 'Robert Downey Jr.' },
    { name: 'Chris Evans' },
    { name: 'Tom Hanks' },
    { name: 'Meryl Streep' },
    { name: 'Denzel Washington' },
    { name: 'Viola Davis' },
    { name: 'Joaquin Phoenix' },
    { name: 'Cate Blanchett' },
    { name: 'Christian Bale' },
    { name: 'Natalie Portman' },
    { name: 'Morgan Freeman' },
    { name: 'Al Pacino' },
    { name: 'Robert De Niro' },
    { name: 'Samuel L. Jackson' },
    { name: 'Keanu Reeves' },
    { name: 'Matt Damon' },
    { name: 'Anne Hathaway' },
    { name: 'Jake Gyllenhaal' },
    { name: 'Amy Adams' },
    { name: 'Ryan Gosling' },
    { name: 'Emma Stone' },
    { name: 'Timothee Chalamet' },
    { name: 'Zendaya' },
    { name: 'Florence Pugh' },
    { name: 'Oscar Isaac' },
    { name: 'Pedro Pascal' },
    // Directors
    { name: 'Christopher Nolan' },
    { name: 'Martin Scorsese' },
    { name: 'Steven Spielberg' },
    { name: 'Denis Villeneuve' },
    { name: 'Quentin Tarantino' },
    { name: 'David Fincher' },
    { name: 'Ridley Scott' },
    { name: 'James Cameron' },
    { name: 'Bong Joon-ho' },
    { name: 'Greta Gerwig' },
    { name: 'Jordan Peele' },
    { name: 'Wes Anderson' },
    // Series actors
    { name: 'Bryan Cranston' },
    { name: 'Aaron Paul' },
    { name: 'Emilia Clarke' },
    { name: 'Kit Harington' },
    { name: 'Millie Bobby Brown' },
    { name: 'David Harbour' },
    { name: 'Elliot Page' },
    { name: 'Henry Cavill' },
    { name: 'Anya Taylor-Joy' },
    { name: 'Jason Bateman' },
    // Series directors/creators
    { name: 'Vince Gilligan' },
    { name: 'David Benioff' },
    { name: 'The Duffer Brothers' },
  ];

  const castMembers = await Promise.all(
    castData.map((c) =>
      prisma.castCrew.create({ data: c }),
    ),
  );

  const castMap = Object.fromEntries(castMembers.map((c) => [c.name, c.id]));
  console.log(`Created ${castMembers.length} cast/crew members`);

  // ============================================
  // MOVIES (30+)
  // ============================================
  const moviesData: {
    type: ContentType;
    title: string;
    description: string;
    releaseYear: number;
    maturityRating: MaturityRating;
    duration: number;
    viewCount: number;
    genres: string[];
    cast: { name: string; role: CastRole; character?: string }[];
  }[] = [
    {
      type: 'MOVIE',
      title: 'Inception',
      description:
        'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
      releaseYear: 2010,
      maturityRating: 'PG13',
      duration: 148,
      viewCount: 15420,
      genres: ['action', 'sci-fi', 'thriller'],
      cast: [
        { name: 'Leonardo DiCaprio', role: 'ACTOR', character: 'Dom Cobb' },
        { name: 'Christopher Nolan', role: 'DIRECTOR' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'The Dark Knight',
      description:
        'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
      releaseYear: 2008,
      maturityRating: 'PG13',
      duration: 152,
      viewCount: 22300,
      genres: ['action', 'crime', 'drama'],
      cast: [
        { name: 'Christian Bale', role: 'ACTOR', character: 'Bruce Wayne' },
        { name: 'Christopher Nolan', role: 'DIRECTOR' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'Interstellar',
      description:
        'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival as Earth becomes uninhabitable.',
      releaseYear: 2014,
      maturityRating: 'PG13',
      duration: 169,
      viewCount: 18500,
      genres: ['sci-fi', 'drama', 'adventure' as never],
      cast: [
        { name: 'Matt Damon', role: 'ACTOR', character: 'Dr. Mann' },
        { name: 'Anne Hathaway', role: 'ACTOR', character: 'Amelia Brand' },
        { name: 'Christopher Nolan', role: 'DIRECTOR' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'The Shawshank Redemption',
      description:
        'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
      releaseYear: 1994,
      maturityRating: 'R',
      duration: 142,
      viewCount: 25000,
      genres: ['drama'],
      cast: [
        { name: 'Morgan Freeman', role: 'ACTOR', character: 'Red' },
        { name: 'Tom Hanks', role: 'ACTOR', character: 'Andy Dufresne' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'Pulp Fiction',
      description:
        'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
      releaseYear: 1994,
      maturityRating: 'R',
      duration: 154,
      viewCount: 19800,
      genres: ['crime', 'drama'],
      cast: [
        { name: 'Samuel L. Jackson', role: 'ACTOR', character: 'Jules Winnfield' },
        { name: 'Quentin Tarantino', role: 'DIRECTOR' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'The Matrix',
      description:
        'When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth: the life he knows is the elaborate deception of an evil cyber-intelligence.',
      releaseYear: 1999,
      maturityRating: 'R',
      duration: 136,
      viewCount: 21000,
      genres: ['action', 'sci-fi'],
      cast: [
        { name: 'Keanu Reeves', role: 'ACTOR', character: 'Neo' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'Fight Club',
      description:
        'An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.',
      releaseYear: 1999,
      maturityRating: 'R',
      duration: 139,
      viewCount: 17200,
      genres: ['drama', 'thriller'],
      cast: [
        { name: 'Brad Pitt', role: 'ACTOR', character: 'Tyler Durden' },
        { name: 'David Fincher', role: 'DIRECTOR' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'Forrest Gump',
      description:
        'The presidencies of Kennedy and Johnson, the Vietnam War, the Watergate scandal and other historical events unfold from the perspective of an Alabama man with an IQ of 75.',
      releaseYear: 1994,
      maturityRating: 'PG13',
      duration: 142,
      viewCount: 23000,
      genres: ['drama', 'romance'],
      cast: [
        { name: 'Tom Hanks', role: 'ACTOR', character: 'Forrest Gump' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'Goodfellas',
      description:
        'The story of Henry Hill and his life in the mob, covering his relationship with his wife Karen Hill and his mob partners Jimmy Conway and Tommy DeVito.',
      releaseYear: 1990,
      maturityRating: 'R',
      duration: 146,
      viewCount: 14500,
      genres: ['crime', 'drama'],
      cast: [
        { name: 'Robert De Niro', role: 'ACTOR', character: 'Jimmy Conway' },
        { name: 'Martin Scorsese', role: 'DIRECTOR' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'The Godfather',
      description:
        'The aging patriarch of an organized crime dynasty in postwar New York City transfers control of his clandestine empire to his reluctant youngest son.',
      releaseYear: 1972,
      maturityRating: 'R',
      duration: 175,
      viewCount: 28000,
      genres: ['crime', 'drama'],
      cast: [
        { name: 'Al Pacino', role: 'ACTOR', character: 'Michael Corleone' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'Parasite',
      description:
        'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
      releaseYear: 2019,
      maturityRating: 'R',
      duration: 132,
      viewCount: 16000,
      genres: ['thriller', 'drama', 'comedy'],
      cast: [
        { name: 'Bong Joon-ho', role: 'DIRECTOR' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'Joker',
      description:
        'In Gotham City, mentally troubled comedian Arthur Fleck is disregarded and mistreated by society. He then embarks on a downward spiral of revolution and bloody crime.',
      releaseYear: 2019,
      maturityRating: 'R',
      duration: 122,
      viewCount: 20100,
      genres: ['crime', 'drama', 'thriller'],
      cast: [
        { name: 'Joaquin Phoenix', role: 'ACTOR', character: 'Arthur Fleck' },
        { name: 'Robert De Niro', role: 'ACTOR', character: 'Murray Franklin' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'Dune',
      description:
        'A noble family becomes embroiled in a war for control over the galaxy\'s most valuable asset while its heir becomes troubled by visions of a dark future.',
      releaseYear: 2021,
      maturityRating: 'PG13',
      duration: 155,
      viewCount: 17800,
      genres: ['sci-fi', 'drama', 'action'],
      cast: [
        { name: 'Timothee Chalamet', role: 'ACTOR', character: 'Paul Atreides' },
        { name: 'Zendaya', role: 'ACTOR', character: 'Chani' },
        { name: 'Oscar Isaac', role: 'ACTOR', character: 'Duke Leto' },
        { name: 'Denis Villeneuve', role: 'DIRECTOR' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'La La Land',
      description:
        'While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.',
      releaseYear: 2016,
      maturityRating: 'PG13',
      duration: 128,
      viewCount: 14000,
      genres: ['romance', 'drama', 'comedy'],
      cast: [
        { name: 'Ryan Gosling', role: 'ACTOR', character: 'Sebastian' },
        { name: 'Emma Stone', role: 'ACTOR', character: 'Mia' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'Get Out',
      description:
        'A young African-American visits his white girlfriend\'s parents for the weekend, where his simmering uneasiness about their reception of him eventually reaches a boiling point.',
      releaseYear: 2017,
      maturityRating: 'R',
      duration: 104,
      viewCount: 13500,
      genres: ['horror', 'mystery', 'thriller'],
      cast: [
        { name: 'Jordan Peele', role: 'DIRECTOR' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'The Grand Budapest Hotel',
      description:
        'A writer encounters the owner of an aging high-class hotel, who tells him of his early years serving as a lobby boy in the hotel\'s glorious years under an exceptional concierge.',
      releaseYear: 2014,
      maturityRating: 'R',
      duration: 99,
      viewCount: 11200,
      genres: ['comedy', 'drama', 'crime'],
      cast: [
        { name: 'Wes Anderson', role: 'DIRECTOR' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'Gladiator',
      description:
        'A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.',
      releaseYear: 2000,
      maturityRating: 'R',
      duration: 155,
      viewCount: 19000,
      genres: ['action', 'drama'],
      cast: [
        { name: 'Ridley Scott', role: 'DIRECTOR' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'Titanic',
      description:
        'A seventeen-year-old aristocrat falls in love with a kind but poor artist aboard the luxurious, ill-fated R.M.S. Titanic.',
      releaseYear: 1997,
      maturityRating: 'PG13',
      duration: 194,
      viewCount: 30000,
      genres: ['romance', 'drama'],
      cast: [
        { name: 'Leonardo DiCaprio', role: 'ACTOR', character: 'Jack Dawson' },
        { name: 'James Cameron', role: 'DIRECTOR' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'The Wolf of Wall Street',
      description:
        'Based on the true story of Jordan Belfort, from his rise to a wealthy stock-broker living the high life to his fall involving crime, corruption and the federal government.',
      releaseYear: 2013,
      maturityRating: 'R',
      duration: 180,
      viewCount: 16800,
      genres: ['crime', 'comedy', 'drama'],
      cast: [
        { name: 'Leonardo DiCaprio', role: 'ACTOR', character: 'Jordan Belfort' },
        { name: 'Margot Robbie', role: 'ACTOR', character: 'Naomi Lapaglia' },
        { name: 'Martin Scorsese', role: 'DIRECTOR' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'Schindler\'s List',
      description:
        'In German-occupied Poland during World War II, industrialist Oskar Schindler gradually becomes concerned for his Jewish workforce after witnessing their persecution by the Nazis.',
      releaseYear: 1993,
      maturityRating: 'R',
      duration: 195,
      viewCount: 15600,
      genres: ['drama'],
      cast: [
        { name: 'Steven Spielberg', role: 'DIRECTOR' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'Saving Private Ryan',
      description:
        'Following the Normandy Landings, a group of U.S. soldiers go behind enemy lines to retrieve a paratrooper whose brothers have been killed in action.',
      releaseYear: 1998,
      maturityRating: 'R',
      duration: 169,
      viewCount: 17500,
      genres: ['drama', 'action'],
      cast: [
        { name: 'Tom Hanks', role: 'ACTOR', character: 'Captain Miller' },
        { name: 'Matt Damon', role: 'ACTOR', character: 'Private Ryan' },
        { name: 'Steven Spielberg', role: 'DIRECTOR' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'Avengers: Endgame',
      description:
        'After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more to reverse Thanos\' actions and restore balance.',
      releaseYear: 2019,
      maturityRating: 'PG13',
      duration: 181,
      viewCount: 32000,
      genres: ['action', 'sci-fi', 'fantasy'],
      cast: [
        { name: 'Robert Downey Jr.', role: 'ACTOR', character: 'Tony Stark' },
        { name: 'Chris Evans', role: 'ACTOR', character: 'Steve Rogers' },
        { name: 'Scarlett Johansson', role: 'ACTOR', character: 'Natasha Romanoff' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'Black Swan',
      description:
        'A committed dancer struggles to maintain her sanity after winning the lead role in a production of Tchaikovsky\'s Swan Lake.',
      releaseYear: 2010,
      maturityRating: 'R',
      duration: 108,
      viewCount: 11800,
      genres: ['drama', 'thriller', 'horror'],
      cast: [
        { name: 'Natalie Portman', role: 'ACTOR', character: 'Nina Sayers' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'Nightcrawler',
      description:
        'When Louis Bloom, a con man desperate for work, muscles into the world of L.A. crime journalism, he blurs the line between observer and participant.',
      releaseYear: 2014,
      maturityRating: 'R',
      duration: 117,
      viewCount: 10500,
      genres: ['crime', 'thriller', 'drama'],
      cast: [
        { name: 'Jake Gyllenhaal', role: 'ACTOR', character: 'Lou Bloom' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'Arrival',
      description:
        'A linguist works with the military to communicate with alien lifeforms after twelve mysterious spacecraft appear around the world.',
      releaseYear: 2016,
      maturityRating: 'PG13',
      duration: 116,
      viewCount: 12800,
      genres: ['sci-fi', 'drama', 'mystery'],
      cast: [
        { name: 'Amy Adams', role: 'ACTOR', character: 'Louise Banks' },
        { name: 'Denis Villeneuve', role: 'DIRECTOR' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'John Wick',
      description:
        'An ex-hit-man comes out of retirement to track down the gangsters that killed his dog and took everything from him.',
      releaseYear: 2014,
      maturityRating: 'R',
      duration: 101,
      viewCount: 16200,
      genres: ['action', 'thriller'],
      cast: [
        { name: 'Keanu Reeves', role: 'ACTOR', character: 'John Wick' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'Once Upon a Time in Hollywood',
      description:
        'A faded television actor and his stunt double strive to achieve fame and success in the final years of Hollywood\'s Golden Age in 1969 Los Angeles.',
      releaseYear: 2019,
      maturityRating: 'R',
      duration: 161,
      viewCount: 12400,
      genres: ['comedy', 'drama'],
      cast: [
        { name: 'Leonardo DiCaprio', role: 'ACTOR', character: 'Rick Dalton' },
        { name: 'Brad Pitt', role: 'ACTOR', character: 'Cliff Booth' },
        { name: 'Margot Robbie', role: 'ACTOR', character: 'Sharon Tate' },
        { name: 'Quentin Tarantino', role: 'DIRECTOR' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'Blade Runner 2049',
      description:
        'Young Blade Runner K\'s discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who\'s been missing for thirty years.',
      releaseYear: 2017,
      maturityRating: 'R',
      duration: 164,
      viewCount: 13100,
      genres: ['sci-fi', 'thriller', 'drama'],
      cast: [
        { name: 'Ryan Gosling', role: 'ACTOR', character: 'K' },
        { name: 'Denis Villeneuve', role: 'DIRECTOR' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'Little Women',
      description:
        'Jo March reflects back and forth on her life, telling the beloved story of the March sisters - four young women each determined to live life on their own terms.',
      releaseYear: 2019,
      maturityRating: 'PG',
      duration: 135,
      viewCount: 10200,
      genres: ['drama', 'romance'],
      cast: [
        { name: 'Florence Pugh', role: 'ACTOR', character: 'Amy March' },
        { name: 'Timothee Chalamet', role: 'ACTOR', character: 'Laurie' },
        { name: 'Greta Gerwig', role: 'DIRECTOR' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'Oppenheimer',
      description:
        'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
      releaseYear: 2023,
      maturityRating: 'R',
      duration: 180,
      viewCount: 24000,
      genres: ['drama', 'thriller'],
      cast: [
        { name: 'Robert Downey Jr.', role: 'ACTOR', character: 'Lewis Strauss' },
        { name: 'Florence Pugh', role: 'ACTOR', character: 'Jean Tatlock' },
        { name: 'Matt Damon', role: 'ACTOR', character: 'Leslie Groves' },
        { name: 'Christopher Nolan', role: 'DIRECTOR' },
      ],
    },
    {
      type: 'MOVIE',
      title: 'Barbie',
      description:
        'Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land. However, when they get a chance to go to the real world, they discover the joys and perils of living among humans.',
      releaseYear: 2023,
      maturityRating: 'PG13',
      duration: 114,
      viewCount: 22500,
      genres: ['comedy', 'fantasy'],
      cast: [
        { name: 'Margot Robbie', role: 'ACTOR', character: 'Barbie' },
        { name: 'Ryan Gosling', role: 'ACTOR', character: 'Ken' },
        { name: 'Greta Gerwig', role: 'DIRECTOR' },
      ],
    },
  ];

  // ============================================
  // SERIES (5+)
  // ============================================
  const seriesData: {
    type: ContentType;
    title: string;
    description: string;
    releaseYear: number;
    maturityRating: MaturityRating;
    viewCount: number;
    genres: string[];
    cast: { name: string; role: CastRole; character?: string }[];
    seasons: {
      seasonNumber: number;
      title: string;
      episodes: { episodeNumber: number; title: string; description: string; duration: number }[];
    }[];
  }[] = [
    {
      type: 'SERIES',
      title: 'Breaking Bad',
      description:
        'A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family\'s future.',
      releaseYear: 2008,
      maturityRating: 'R',
      viewCount: 35000,
      genres: ['crime', 'drama', 'thriller'],
      cast: [
        { name: 'Bryan Cranston', role: 'ACTOR', character: 'Walter White' },
        { name: 'Aaron Paul', role: 'ACTOR', character: 'Jesse Pinkman' },
        { name: 'Vince Gilligan', role: 'DIRECTOR' },
      ],
      seasons: [
        {
          seasonNumber: 1,
          title: 'Season 1',
          episodes: [
            { episodeNumber: 1, title: 'Pilot', description: 'Walter White, a struggling high school chemistry teacher, is diagnosed with advanced lung cancer.', duration: 58 },
            { episodeNumber: 2, title: 'Cat\'s in the Bag...', description: 'Walt and Jesse attempt to tie up loose ends.', duration: 48 },
            { episodeNumber: 3, title: '...And the Bag\'s in the River', description: 'Walt is faced with the prospect of killing Krazy-8.', duration: 48 },
          ],
        },
        {
          seasonNumber: 2,
          title: 'Season 2',
          episodes: [
            { episodeNumber: 1, title: 'Seven Thirty-Seven', description: 'Walt and Jesse face the deadly consequences of their encounter with Tuco.', duration: 47 },
            { episodeNumber: 2, title: 'Grilled', description: 'Walt and Jesse find themselves trapped by an unstable Tuco.', duration: 48 },
            { episodeNumber: 3, title: 'Bit by a Dead Bee', description: 'Walt and Jesse deal with the aftermath of Tuco\'s death.', duration: 47 },
          ],
        },
      ],
    },
    {
      type: 'SERIES',
      title: 'Stranger Things',
      description:
        'When a young boy disappears, his mother, a police chief, and his friends must confront terrifying supernatural forces in order to get him back.',
      releaseYear: 2016,
      maturityRating: 'PG13',
      viewCount: 28000,
      genres: ['sci-fi', 'horror', 'drama'],
      cast: [
        { name: 'Millie Bobby Brown', role: 'ACTOR', character: 'Eleven' },
        { name: 'David Harbour', role: 'ACTOR', character: 'Jim Hopper' },
        { name: 'The Duffer Brothers', role: 'DIRECTOR' },
      ],
      seasons: [
        {
          seasonNumber: 1,
          title: 'Season 1',
          episodes: [
            { episodeNumber: 1, title: 'The Vanishing of Will Byers', description: 'On his way home from a friend\'s house, young Will sees something terrifying.', duration: 49 },
            { episodeNumber: 2, title: 'The Weirdo on Maple Street', description: 'Lucas, Mike, and Dustin try to talk to the girl they found in the woods.', duration: 56 },
            { episodeNumber: 3, title: 'Holly, Jolly', description: 'An increasingly desperate Joyce tries to reach Will.', duration: 51 },
          ],
        },
        {
          seasonNumber: 2,
          title: 'Season 2',
          episodes: [
            { episodeNumber: 1, title: 'MADMAX', description: 'As the town preps for Halloween, a series of events begins to unsettle the community.', duration: 48 },
            { episodeNumber: 2, title: 'Trick or Treat, Freak', description: 'After Will sees something terrible on trick-or-treat night, Mike wonders about Eleven.', duration: 56 },
            { episodeNumber: 3, title: 'The Pollywog', description: 'Dustin adopts a strange new pet; Eleven grows frustrated with her situation.', duration: 51 },
          ],
        },
      ],
    },
    {
      type: 'SERIES',
      title: 'The Queen\'s Gambit',
      description:
        'Orphaned at the tender age of nine, prodigious introvert Beth Harmon discovers and masters the game of chess in 1960s USA. But child stardom comes at a price.',
      releaseYear: 2020,
      maturityRating: 'PG13',
      viewCount: 22000,
      genres: ['drama'],
      cast: [
        { name: 'Anya Taylor-Joy', role: 'ACTOR', character: 'Beth Harmon' },
      ],
      seasons: [
        {
          seasonNumber: 1,
          title: 'Season 1',
          episodes: [
            { episodeNumber: 1, title: 'Openings', description: 'Sent to an orphanage at age 9, Beth develops an uncanny knack for chess.', duration: 59 },
            { episodeNumber: 2, title: 'Exchanges', description: 'Beth is adopted. She enters the world of competitive chess.', duration: 52 },
            { episodeNumber: 3, title: 'Doubled Pawns', description: 'Beth enters her first tournament and faces a formidable opponent.', duration: 48 },
            { episodeNumber: 4, title: 'Middle Game', description: 'Beth rises through the ranks, but struggles with dependency.', duration: 50 },
            { episodeNumber: 5, title: 'Fork', description: 'Beth faces her greatest challenge yet at the U.S. Championship.', duration: 47 },
            { episodeNumber: 6, title: 'Adjournment', description: 'Beth travels to Paris for an international tournament.', duration: 55 },
            { episodeNumber: 7, title: 'End Game', description: 'Beth confronts her demons in a final showdown in Moscow.', duration: 67 },
          ],
        },
      ],
    },
    {
      type: 'SERIES',
      title: 'Ozark',
      description:
        'A financial adviser drags his family from Chicago to the Missouri Ozarks, where he must launder money for a drug boss to stay alive.',
      releaseYear: 2017,
      maturityRating: 'R',
      viewCount: 18500,
      genres: ['crime', 'drama', 'thriller'],
      cast: [
        { name: 'Jason Bateman', role: 'ACTOR', character: 'Marty Byrde' },
        { name: 'Jason Bateman', role: 'DIRECTOR' },
      ],
      seasons: [
        {
          seasonNumber: 1,
          title: 'Season 1',
          episodes: [
            { episodeNumber: 1, title: 'Sugarwood', description: 'Marty Byrde proposes a bold plan to avoid getting killed by the cartel.', duration: 67 },
            { episodeNumber: 2, title: 'Blue Cat', description: 'The Byrdes arrive in the Ozarks and begin their new lives.', duration: 60 },
            { episodeNumber: 3, title: 'My Dripping Sleep', description: 'Marty looks to invest in a local business.', duration: 58 },
          ],
        },
        {
          seasonNumber: 2,
          title: 'Season 2',
          episodes: [
            { episodeNumber: 1, title: 'Reparations', description: 'Marty and Wendy face new challenges as their operation grows.', duration: 62 },
            { episodeNumber: 2, title: 'The Precious Blood of Jesus', description: 'Tensions rise between the Byrdes and local crime figures.', duration: 55 },
            { episodeNumber: 3, title: 'Once a Langmore', description: 'Ruth makes a difficult decision that affects her family.', duration: 57 },
          ],
        },
      ],
    },
    {
      type: 'SERIES',
      title: 'The Witcher',
      description:
        'Geralt of Rivia, a solitary monster hunter, struggles to find his place in a world where people often prove more wicked than beasts.',
      releaseYear: 2019,
      maturityRating: 'R',
      viewCount: 20500,
      genres: ['fantasy', 'action', 'drama'],
      cast: [
        { name: 'Henry Cavill', role: 'ACTOR', character: 'Geralt of Rivia' },
      ],
      seasons: [
        {
          seasonNumber: 1,
          title: 'Season 1',
          episodes: [
            { episodeNumber: 1, title: 'The End\'s Beginning', description: 'Geralt of Rivia arrives in the town of Blaviken.', duration: 61 },
            { episodeNumber: 2, title: 'Four Marks', description: 'Yennefer\'s life changes forever.', duration: 61 },
            { episodeNumber: 3, title: 'Betrayer Moon', description: 'Geralt investigates a terrifying creature.', duration: 67 },
          ],
        },
        {
          seasonNumber: 2,
          title: 'Season 2',
          episodes: [
            { episodeNumber: 1, title: 'A Grain of Truth', description: 'Geralt brings Ciri to Kaer Morhen.', duration: 60 },
            { episodeNumber: 2, title: 'Kaer Morhen', description: 'Ciri trains with the witchers.', duration: 55 },
            { episodeNumber: 3, title: 'What Is Lost', description: 'Yennefer faces the consequences of her choices.', duration: 58 },
          ],
        },
      ],
    },
    {
      type: 'SERIES',
      title: 'The Last of Us',
      description:
        'After a global pandemic destroys civilization, a hardened survivor takes charge of a 14-year-old girl who may be humanity\'s last hope.',
      releaseYear: 2023,
      maturityRating: 'R',
      viewCount: 26000,
      genres: ['drama', 'action', 'sci-fi'],
      cast: [
        { name: 'Pedro Pascal', role: 'ACTOR', character: 'Joel Miller' },
      ],
      seasons: [
        {
          seasonNumber: 1,
          title: 'Season 1',
          episodes: [
            { episodeNumber: 1, title: 'When You\'re Lost in the Darkness', description: 'Twenty years after a fungal plague ravages the planet, Joel is tasked with a mission.', duration: 81 },
            { episodeNumber: 2, title: 'Infected', description: 'Joel and Tess take Ellie on a dangerous journey.', duration: 53 },
            { episodeNumber: 3, title: 'Long, Long Time', description: 'A story of survival and love in the post-apocalyptic world.', duration: 76 },
          ],
        },
      ],
    },
  ];

  // ============================================
  // CREATE MOVIES
  // ============================================
  let movieCount = 0;
  for (const movie of moviesData) {
    const content = await prisma.content.create({
      data: {
        type: movie.type,
        title: movie.title,
        description: movie.description,
        releaseYear: movie.releaseYear,
        maturityRating: movie.maturityRating,
        duration: movie.duration,
        viewCount: movie.viewCount,
        thumbnailUrl: `/images/content/${movie.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-thumb.jpg`,
        bannerUrl: `/images/content/${movie.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-banner.jpg`,
      },
    });

    // Link genres
    for (const genreSlug of movie.genres) {
      if (genreMap[genreSlug]) {
        await prisma.contentGenre.create({
          data: { contentId: content.id, genreId: genreMap[genreSlug] },
        });
      }
    }

    // Link cast
    for (let i = 0; i < movie.cast.length; i++) {
      const c = movie.cast[i];
      if (castMap[c.name]) {
        await prisma.contentCastCrew.create({
          data: {
            contentId: content.id,
            castCrewId: castMap[c.name],
            role: c.role,
            character: c.character || null,
            displayOrder: i,
          },
        });
      }
    }

    movieCount++;
  }
  console.log(`Created ${movieCount} movies`);

  // ============================================
  // CREATE SERIES
  // ============================================
  let seriesCount = 0;
  for (const series of seriesData) {
    const content = await prisma.content.create({
      data: {
        type: series.type,
        title: series.title,
        description: series.description,
        releaseYear: series.releaseYear,
        maturityRating: series.maturityRating,
        viewCount: series.viewCount,
        thumbnailUrl: `/images/content/${series.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-thumb.jpg`,
        bannerUrl: `/images/content/${series.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-banner.jpg`,
      },
    });

    // Link genres
    for (const genreSlug of series.genres) {
      if (genreMap[genreSlug]) {
        await prisma.contentGenre.create({
          data: { contentId: content.id, genreId: genreMap[genreSlug] },
        });
      }
    }

    // Link cast
    for (let i = 0; i < series.cast.length; i++) {
      const c = series.cast[i];
      if (castMap[c.name]) {
        await prisma.contentCastCrew.create({
          data: {
            contentId: content.id,
            castCrewId: castMap[c.name],
            role: c.role,
            character: c.character || null,
            displayOrder: i,
          },
        });
      }
    }

    // Create seasons + episodes
    for (const season of series.seasons) {
      const createdSeason = await prisma.season.create({
        data: {
          contentId: content.id,
          seasonNumber: season.seasonNumber,
          title: season.title,
        },
      });

      for (const episode of season.episodes) {
        await prisma.episode.create({
          data: {
            seasonId: createdSeason.id,
            episodeNumber: episode.episodeNumber,
            title: episode.title,
            description: episode.description,
            duration: episode.duration,
            thumbnailUrl: `/images/content/${series.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-s${season.seasonNumber}e${episode.episodeNumber}-thumb.jpg`,
          },
        });
      }
    }

    seriesCount++;
  }
  console.log(`Created ${seriesCount} series`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
