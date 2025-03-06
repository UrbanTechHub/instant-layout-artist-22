
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Mail, Phone, MapPin, MessageSquare, Send, Clock } from 'lucide-react';
import Layout from '@/components/Layout';
import { toast } from '@/components/ui/use-toast';

const ContactPage = () => {
  const { connected, publicKey } = useWallet();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !message) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message Sent",
        description: "We'll get back to you as soon as possible.",
      });
      setIsSubmitting(false);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }, 1500);
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
            Contact Us
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Have questions or need assistance? Our team is here to help you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Your Name <span className="text-red-400">*</span>
                    </label>
                    <input 
                      type="text"
                      className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input 
                      type="email"
                      className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-white font-medium mb-2">
                    Subject
                  </label>
                  <input 
                    type="text"
                    className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
                    placeholder="Enter subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                
                {connected && (
                  <div className="mb-6">
                    <label className="block text-white font-medium mb-2">
                      Your Wallet Address
                    </label>
                    <div className="bg-white/10 rounded-lg p-3 text-gray-300 break-all">
                      {publicKey?.toString()}
                    </div>
                  </div>
                )}
                
                <div className="mb-6">
                  <label className="block text-white font-medium mb-2">
                    Message <span className="text-red-400">*</span>
                  </label>
                  <textarea 
                    className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white min-h-[200px]"
                    placeholder="How can we help you?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  ></textarea>
                </div>
                
                <div>
                  <button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 rounded-xl text-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-8">
              <h2 className="text-xl font-bold mb-6">Contact Information</h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Email Us</h3>
                    <p className="text-gray-300">support@cryptoguard.com</p>
                    <p className="text-gray-300">recovery@cryptoguard.com</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Call Us</h3>
                    <p className="text-gray-300">+1 (888) 123-4567</p>
                    <p className="text-gray-300">+1 (888) 987-6543</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Working Hours</h3>
                    <p className="text-gray-300">Monday - Friday: 9AM - 8PM EST</p>
                    <p className="text-gray-300">Weekend: 10AM - 6PM EST</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
              <h2 className="text-xl font-bold mb-6">Frequently Asked</h2>
              
              <div className="space-y-4">
                <div className="border-b border-white/10 pb-4">
                  <h3 className="font-medium mb-2">How quickly can you recover lost funds?</h3>
                  <p className="text-gray-400 text-sm">
                    Recovery timeframes vary based on case complexity. Simple cases may be resolved in days, while complex ones might take weeks.
                  </p>
                </div>
                
                <div className="border-b border-white/10 pb-4">
                  <h3 className="font-medium mb-2">What blockchain networks do you support?</h3>
                  <p className="text-gray-400 text-sm">
                    We support most major blockchains including Bitcoin, Ethereum, Solana, Binance Smart Chain, and many others.
                  </p>
                </div>
                
                <div className="border-b border-white/10 pb-4">
                  <h3 className="font-medium mb-2">Is there a fee for consultations?</h3>
                  <p className="text-gray-400 text-sm">
                    Initial consultations are free. Recovery services have fees based on the complexity and resources required.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">How do I start the recovery process?</h3>
                  <p className="text-gray-400 text-sm">
                    Connect your wallet and submit a recovery request through our Recovery page, or contact us directly via this form.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
          <div className="aspect-w-16 aspect-h-9 h-[400px]">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.9916256937585!2d2.292292615509614!3d48.85837007928746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66e2964e34e2d%3A0x8ddca9ee380ef7e0!2sEiffel%20Tower!5e0!3m2!1sen!2sus!4v1631539764075!5m2!1sen!2sus" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              title="Google Maps"
            ></iframe>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactPage;
