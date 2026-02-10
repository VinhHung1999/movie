'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';

const footerLinks = [
  ['FAQ', 'Help Center', 'Account', 'Media Center'],
  ['Investor Relations', 'Jobs', 'Ways to Watch', 'Terms of Use'],
  ['Privacy', 'Cookie Preferences', 'Corporate Information', 'Contact Us'],
  ['Speed Test', 'Legal Notices', 'Only on WebPhim', 'Ad Choices'],
];

const languages = ['English', 'Tiếng Việt'];

export default function Footer() {
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('English');

  return (
    <footer className="mx-auto max-w-6xl px-4 py-12 text-netflix-mid-gray md:px-12">
      <p className="mb-6 text-base">
        Questions? <a href="#" className="underline hover:text-netflix-white">Contact us.</a>
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        {footerLinks.map((column, colIdx) => (
          <ul key={colIdx} className="space-y-3">
            {column.map((link) => (
              <li key={link}>
                <a href="#" className="underline hover:text-netflix-white">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        ))}
      </div>

      <div className="relative mb-6 inline-block">
        <button
          onClick={() => setLangOpen(!langOpen)}
          className="flex items-center gap-2 rounded border border-netflix-border px-4 py-2 text-sm text-netflix-mid-gray hover:text-netflix-white"
        >
          <Globe size={16} />
          {selectedLang}
        </button>
        {langOpen && (
          <ul className="absolute bottom-full left-0 mb-1 rounded border border-netflix-border bg-netflix-black py-1">
            {languages.map((lang) => (
              <li key={lang}>
                <button
                  onClick={() => { setSelectedLang(lang); setLangOpen(false); }}
                  className="w-full px-6 py-2 text-left text-sm hover:bg-netflix-gray hover:text-netflix-white"
                >
                  {lang}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs">&copy; {new Date().getFullYear()} WebPhim</p>
    </footer>
  );
}
