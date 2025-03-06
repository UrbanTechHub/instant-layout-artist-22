
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Shield, Search, Key, AlertTriangle, Wallet, CheckCircle, Lock } from 'lucide-react';
import Layout from '@/components/Layout';
import { Link } from 'react-router-dom';

const Index = () => {
  const { connected } = useWallet();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="heading-1 mb-6 gradient-text">
                Crypto Recovery & Security Solutions
              </h1>
              <p className="body-large mb-8">
                Professional assistance in recovering lost crypto funds, fixing wallet issues, and 
                enhancing your digital asset security.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {!connected ? (
                  <WalletMultiButton className="primary-button" />
                ) : (
                  <Link 
                    to="/recovery" 
                    className="primary-button block text-center"
                  >
                    Start Recovery Process
                  </Link>
                )}
                <Link 
                  to="/contact" 
                  className="secondary-button block text-center"
                >
                  Contact Support
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/10 rounded-3xl blur-3xl"></div>
              <div className="relative bg-white/95 shadow-lg border border-blue-100 p-8 rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 p-[2px] mx-auto mb-6">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <Shield className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <h2 className="heading-2 text-center mb-6">Connect Your Wallet</h2>
                <p className="body-normal text-center mb-8">
                  Connect your wallet to access our recovery services, security audit tools, and specialized support.
                </p>
                <div className="flex justify-center">
                  <WalletMultiButton className="primary-button" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 px-4 bg-blue-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="heading-2 mb-4 gradient-text">
              Our Services
            </h2>
            <p className="body-large max-w-2xl mx-auto">
              Comprehensive solutions for all your crypto security and recovery needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div 
                key={index} 
                className="feature-card hover:translate-y-[-5px]"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 p-[2px] mb-6">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <service.icon className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
                <h3 className="heading-3 mb-3">{service.title}</h3>
                <p className="body-normal mb-4">{service.description}</p>
                <Link 
                  to={service.link} 
                  className="text-blue-600 flex items-center gap-2 hover:text-blue-700 transition-colors"
                >
                  Learn more
                  <span className="text-xs">→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="heading-2 mb-4 gradient-text">
              How It Works
            </h2>
            <p className="body-large max-w-2xl mx-auto">
              Our proven process to recover your crypto assets and secure your wallet
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-blue-500 to-transparent z-0"></div>
                )}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 p-[2px] mb-6 flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue-500">{index + 1}</span>
                    </div>
                  </div>
                  <h3 className="heading-3 mb-3">{step.title}</h3>
                  <p className="body-normal">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-blue-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="heading-2 mb-4 gradient-text">
              Success Stories
            </h2>
            <p className="body-large max-w-2xl mx-auto">
              See how we've helped others recover their crypto assets
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="feature-card"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 p-[2px]">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-blue-600 font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.title}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.content}"</p>
                <div className="mt-4 flex">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl shadow-lg p-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Ready to Recover Your Crypto Assets?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Connect your wallet or contact our team to get started with your recovery process today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <WalletMultiButton className="bg-white text-blue-600 px-6 py-3 rounded-xl text-lg font-medium hover:bg-blue-50 transition-opacity whitespace-nowrap" />
              <Link 
                to="/contact" 
                className="border border-white/30 bg-blue-600/30 text-white px-6 py-3 rounded-xl text-lg font-medium hover:bg-blue-600/40 transition-colors whitespace-nowrap"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

// Data
const services = [
  {
    title: "Crypto Fund Recovery",
    description: "We help recover lost or stolen cryptocurrency through advanced technical methods and legal channels.",
    icon: Search,
    link: "/recovery"
  },
  {
    title: "Wallet Security Audit",
    description: "Comprehensive audit of your wallet security practices with actionable recommendations.",
    icon: Shield,
    link: "/security"
  },
  {
    title: "Scam Reporting",
    description: "Report crypto scams and fraudulent activities to help protect the community.",
    icon: AlertTriangle,
    link: "/report"
  },
  {
    title: "Wallet Issue Resolution",
    description: "Technical support for wallet connectivity issues, transaction problems, and more.",
    icon: Wallet,
    link: "/wallet-support"
  },
  {
    title: "Private Key Recovery",
    description: "Specialized services to help recover lost or forgotten private keys and seed phrases.",
    icon: Key,
    link: "/key-recovery"
  },
  {
    title: "Security Consulting",
    description: "Expert advice on securing your digital assets and implementing best practices.",
    icon: Lock,
    link: "/consulting"
  }
];

const steps = [
  {
    title: "Connect Wallet",
    description: "Connect your wallet to start the recovery process securely or describe your issue in detail."
  },
  {
    title: "Security Assessment",
    description: "Our experts analyze your situation and provide a tailored recovery plan."
  },
  {
    title: "Recovery Process",
    description: "We implement advanced technical solutions to recover your assets or resolve wallet issues."
  }
];

const testimonials = [
  {
    name: "Alex T.",
    title: "Recovered 2.5 ETH",
    content: "After losing access to my wallet, I thought my crypto was gone forever. The team helped me recover everything within 48 hours!"
  },
  {
    name: "Sarah M.",
    title: "Recovered 15,000 USDT",
    content: "I was scammed but CryptoGuard helped track and recover most of my funds. Their expertise was invaluable."
  },
  {
    name: "Michael R.",
    title: "Fixed wallet connectivity",
    content: "I had persistent issues with my hardware wallet. Their technical team solved problems that no one else could fix."
  }
];

export default Index;
