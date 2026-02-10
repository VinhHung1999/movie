import prisma from '../config/database';

export const genreService = {
  async list() {
    const genres = await prisma.genre.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { contentGenres: true },
        },
      },
    });

    return genres.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      contentCount: g._count.contentGenres,
    }));
  },
};
