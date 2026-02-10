'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Accordion, { type AccordionItem } from '@/components/ui/Accordion';

const faqItems: AccordionItem[] = [
  {
    question: 'What is WebPhim?',
    answer: 'WebPhim is a streaming service that offers a wide variety of award-winning TV shows, movies, anime, documentaries, and more on thousands of internet-connected devices. You can watch as much as you want, whenever you want – all for one low monthly price.',
  },
  {
    question: 'How much does WebPhim cost?',
    answer: 'Watch WebPhim on your smartphone, tablet, Smart TV, laptop, or streaming device, all for one fixed monthly fee. Plans range from $6.99 to $22.99 a month. No extra costs, no contracts.',
  },
  {
    question: 'Where can I watch?',
    answer: 'Watch anywhere, anytime. Sign in with your WebPhim account to watch instantly on the web at webphim.com from your personal computer or on any internet-connected device that offers the WebPhim app.',
  },
  {
    question: 'How do I cancel?',
    answer: 'WebPhim is flexible. There are no pesky contracts and no commitments. You can easily cancel your account online in two clicks. There are no cancellation fees – start or stop your account anytime.',
  },
  {
    question: 'What can I watch on WebPhim?',
    answer: 'WebPhim has an extensive library of feature films, documentaries, TV shows, anime, award-winning originals, and more. Watch as much as you want, anytime you want.',
  },
  {
    question: 'Is WebPhim good for kids?',
    answer: 'The WebPhim Kids experience is included in your membership to give parents control while kids enjoy family-friendly TV shows and movies in their own space. Kids profiles come with PIN-protected parental controls.',
  },
];

export default function FAQ() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/signup${email ? `?email=${encodeURIComponent(email)}` : ''}`);
  };

  return (
    <section className="border-t-[6px] border-netflix-dark-gray/60 bg-netflix-black py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-6 md:px-12">
        <motion.h2
          className="mb-10 text-center text-3xl font-extrabold tracking-tight text-white md:text-4xl lg:text-5xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          Frequently Asked Questions
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        >
          <Accordion items={faqItems} />
        </motion.div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
        >
          <p className="mb-5 text-base text-netflix-light-gray md:text-lg">
            Ready to watch? Enter your email to create or restart your membership.
          </p>
          <form onSubmit={handleGetStarted} className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-sm border border-white/20 bg-black/50 px-5 py-3.5 text-base text-white placeholder-netflix-mid-gray backdrop-blur-sm outline-none transition-all duration-200 focus:border-white/50 focus:bg-black/60 focus:shadow-[0_0_0_1px_rgba(255,255,255,0.2)]"
            />
            <button
              type="submit"
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-sm bg-netflix-red px-8 py-3.5 text-xl font-semibold text-white transition-all duration-200 hover:bg-netflix-red-hover hover:shadow-[0_4px_20px_rgba(229,9,20,0.4)]"
            >
              Get Started
              <ChevronRight size={24} strokeWidth={2.5} />
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
