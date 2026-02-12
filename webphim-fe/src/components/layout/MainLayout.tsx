'use client';

import AuthNavbar from './AuthNavbar';
import Footer from './Footer';
import PageTransition from './PageTransition';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <AuthNavbar />
      <main className="min-h-screen pt-16">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </>
  );
}
