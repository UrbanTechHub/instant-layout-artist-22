
import { Shield, Twitter, Facebook, Instagram, Mail, Phone, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically handle newsletter signup
    setEmail('');
    // Show success notification
    alert('Thank you for subscribing to our newsletter!');
  };

  return (
    <footer className="bg-gradient-to-b from-blue-50 to-blue-100 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-blue-800">
                CryptoGuard
              </span>
            </div>
            <p className="text-blue-700 mb-6">
              Professional crypto recovery services and wallet security solutions for the digital asset ecosystem.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300 text-blue-600 hover:text-blue-800">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300 text-blue-600 hover:text-blue-800">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300 text-blue-600 hover:text-blue-800">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-blue-800 font-bold mb-6">Services</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/recovery" className="text-blue-700 hover:text-blue-900 transition-colors flex items-center group">
                  <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1" />
                  <span className="group-hover:translate-x-1 transition-all duration-300">Crypto Fund Recovery</span>
                </Link>
              </li>
              <li>
                <Link to="/security" className="text-blue-700 hover:text-blue-900 transition-colors flex items-center group">
                  <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1" />
                  <span className="group-hover:translate-x-1 transition-all duration-300">Wallet Security</span>
                </Link>
              </li>
              <li>
                <Link to="/report" className="text-blue-700 hover:text-blue-900 transition-colors flex items-center group">
                  <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1" />
                  <span className="group-hover:translate-x-1 transition-all duration-300">Report Scams</span>
                </Link>
              </li>
              <li>
                <Link to="/security" className="text-blue-700 hover:text-blue-900 transition-colors flex items-center group">
                  <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1" />
                  <span className="group-hover:translate-x-1 transition-all duration-300">Security Audits</span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-blue-800 font-bold mb-6">Resources</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/blog" className="text-blue-700 hover:text-blue-900 transition-colors flex items-center group">
                  <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1" />
                  <span className="group-hover:translate-x-1 transition-all duration-300">Blog</span>
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-blue-700 hover:text-blue-900 transition-colors flex items-center group">
                  <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1" />
                  <span className="group-hover:translate-x-1 transition-all duration-300">FAQ</span>
                </Link>
              </li>
              <li>
                <Link to="/guides" className="text-blue-700 hover:text-blue-900 transition-colors flex items-center group">
                  <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1" />
                  <span className="group-hover:translate-x-1 transition-all duration-300">Security Guides</span>
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-blue-700 hover:text-blue-900 transition-colors flex items-center group">
                  <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1" />
                  <span className="group-hover:translate-x-1 transition-all duration-300">Terms of Service</span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <h3 className="text-blue-800 font-bold mb-6">Newsletter</h3>
            <p className="text-blue-700 mb-4">Stay updated with the latest in crypto security and recovery.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address" 
                  className="w-full px-4 py-3 rounded-full border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300"
                  required
                />
                <button 
                  type="submit" 
                  className="absolute right-1 top-1 bottom-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 transition-colors duration-300"
                >
                  Subscribe
                </button>
              </div>
            </form>
            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3 text-blue-700">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>support@cryptoguard.com</span>
              </div>
              <div className="flex items-start gap-3 text-blue-700">
                <Phone className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>+1 (888) 123-4567</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-blue-200 pt-8 text-center animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <p className="text-blue-700 text-sm">
            © {new Date().getFullYear()} CryptoGuard. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
