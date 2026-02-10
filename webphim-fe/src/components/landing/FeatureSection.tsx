'use client';

import { motion } from 'framer-motion';
import { Tv, Download, MonitorSmartphone, Users } from 'lucide-react';

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  glowColor: string;
}

const features: Feature[] = [
  {
    title: 'Enjoy on your TV',
    description: 'Watch on Smart TVs, PlayStation, Xbox, Chromecast, Apple TV, Blu-ray players, and more.',
    icon: <Tv size={64} strokeWidth={1.5} />,
    gradient: 'from-blue-600/20 via-purple-600/10 to-transparent',
    glowColor: 'rgba(59, 130, 246, 0.3)',
  },
  {
    title: 'Download your shows to watch offline',
    description: 'Save your favorites easily and always have something to watch.',
    icon: <Download size={64} strokeWidth={1.5} />,
    gradient: 'from-emerald-600/20 via-teal-600/10 to-transparent',
    glowColor: 'rgba(16, 185, 129, 0.3)',
  },
  {
    title: 'Watch everywhere',
    description: 'Stream unlimited movies and TV shows on your phone, tablet, laptop, and TV.',
    icon: <MonitorSmartphone size={64} strokeWidth={1.5} />,
    gradient: 'from-orange-600/20 via-amber-600/10 to-transparent',
    glowColor: 'rgba(249, 115, 22, 0.3)',
  },
  {
    title: 'Create profiles for kids',
    description: 'Send kids on adventures with their favorite characters in a space made just for them — free with your membership.',
    icon: <Users size={64} strokeWidth={1.5} />,
    gradient: 'from-pink-600/20 via-rose-600/10 to-transparent',
    glowColor: 'rgba(236, 72, 153, 0.3)',
  },
];

export default function FeatureSections() {
  return (
    <div>
      {features.map((feature, index) => (
        <section
          key={feature.title}
          className="border-t-[6px] border-netflix-dark-gray/60 bg-netflix-black py-16 md:py-24"
        >
          <div
            className={`mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 md:gap-16 md:px-12 ${
              index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
            }`}
          >
            {/* Text block */}
            <motion.div
              className="flex-1 text-center md:text-left"
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <h2 className="mb-5 text-3xl font-extrabold tracking-tight text-white md:text-4xl lg:text-5xl">
                {feature.title}
              </h2>
              <p className="text-lg leading-relaxed text-netflix-light-gray md:text-xl">
                {feature.description}
              </p>
            </motion.div>

            {/* Visual block - CSS illustration */}
            <motion.div
              className="flex flex-1 items-center justify-center"
              initial={{ opacity: 0, x: index % 2 === 0 ? 30 : -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
            >
              <div className="relative flex h-64 w-full max-w-md items-center justify-center md:h-80">
                {/* Glow backdrop */}
                <div
                  className="absolute h-48 w-48 rounded-full blur-[80px]"
                  style={{ backgroundColor: feature.glowColor }}
                />

                {/* Card with gradient */}
                <div className={`relative flex h-48 w-48 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} border border-white/[0.06] backdrop-blur-sm md:h-56 md:w-56`}>
                  <div className="text-white/80">
                    {feature.icon}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      ))}
    </div>
  );
}
