
import { ReactNode, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  // Animate on page load
  useEffect(() => {
    // Add animation class to sections
    const sections = document.querySelectorAll('section');
    sections.forEach((section, index) => {
      setTimeout(() => {
        section.classList.add('opacity-100');
        section.classList.remove('opacity-0', 'translate-y-4');
      }, 200 * index);
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
