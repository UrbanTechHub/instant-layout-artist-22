
import { Link } from 'react-router-dom';
import { Shield, Menu, X } from 'lucide-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect } from 'react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Handle scroll event to change header style
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 w-full ${
        isScrolled 
          ? 'bg-white shadow-md py-2' 
          : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className={`w-10 h-10 rounded-full ${
              isScrolled ? 'bg-primary' : 'bg-primary'
            } transition-colors duration-300 flex items-center justify-center group-hover:animate-pulse-soft`}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className={`text-xl font-bold ${
              isScrolled ? 'text-primary' : 'text-primary'
            } transition-colors duration-300`}>
              CryptoGuard
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-800 hover:text-primary transition-colors font-medium">
              Home
            </Link>
            <Link to="/recovery" className="text-gray-800 hover:text-primary transition-colors font-medium">
              Fund Recovery
            </Link>
            <Link to="/security" className="text-gray-800 hover:text-primary transition-colors font-medium">
              Security
            </Link>
            <Link to="/report" className="text-gray-800 hover:text-primary transition-colors font-medium">
              Report Fraud
            </Link>
            <Link to="/contact" className="text-gray-800 hover:text-primary transition-colors font-medium">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <WalletMultiButton className="bg-primary hover:bg-primary/90 text-white rounded-lg px-6 py-2 text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-md whitespace-nowrap" />
            
            {/* Mobile menu button */}
            <button 
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors text-primary"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 animate-fade-in">
            <nav className="flex flex-col gap-4 bg-white p-4 rounded-lg shadow-lg">
              <Link 
                to="/"
                className="text-gray-800 hover:text-primary transition-colors py-2 hover:bg-blue-50 px-4 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/recovery"
                className="text-gray-800 hover:text-primary transition-colors py-2 hover:bg-blue-50 px-4 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Fund Recovery
              </Link>
              <Link 
                to="/security"
                className="text-gray-800 hover:text-primary transition-colors py-2 hover:bg-blue-50 px-4 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Security
              </Link>
              <Link 
                to="/report"
                className="text-gray-800 hover:text-primary transition-colors py-2 hover:bg-blue-50 px-4 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Report Fraud
              </Link>
              <Link 
                to="/contact"
                className="text-gray-800 hover:text-primary transition-colors py-2 hover:bg-blue-50 px-4 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
