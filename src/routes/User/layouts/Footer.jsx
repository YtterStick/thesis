import { MapPin, Phone, Mail, Clock, ArrowUpRight } from 'lucide-react';

// Footer component
const Footer = ({ isDarkMode }) => {
  return (
    <footer 
      className="transition-colors duration-300 border-t"
      style={{
        backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Top Section - Brand & Contact */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Brand & Contact */}
          <div className="space-y-4 lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg overflow-hidden border"
                style={{
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#ffffff',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'
                }}
              >
                <img
                  src="/logo.gif"
                  alt="Star Wash Logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <span 
                className="font-deathstar text-2xl tracking-wider"
                style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}
              >
                STAR WASH
              </span>
            </div>
            <p 
              className="text-lg font-bold tracking-wide mb-2 bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent"
            >
              FRESH LAUNDRY, MADE EASY
            </p>
            
            <div 
              className="space-y-3 text-base"
              style={{ color: isDarkMode ? '#94a3b8' : '#475569' }}
            >
              <div className="flex items-start space-x-3">
                <Mail className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold" style={{ color: isDarkMode ? '#cbd5e1' : '#1e293b' }}>Email</p>
                  <p>starwashph_stalucia@gmail.com</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Phone className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold" style={{ color: isDarkMode ? '#cbd5e1' : '#1e293b' }}>Phone</p>
                  <p>09150475513</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold" style={{ color: isDarkMode ? '#cbd5e1' : '#1e293b' }}>Business Hours</p>
                  <p>Monday - Sunday</p>
                  <p>7:00 AM - 7:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4 lg:col-span-1">
            <h3 
              className="font-bold text-lg tracking-wider"
              style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}
            >
              QUICK NAVIGATION
            </h3>
            <div className="space-y-3">
              {[
                { href: "#home", label: "Home" },
                { href: "#services", label: "Services & Pricing" },
                { href: "#service_tracking", label: "Laundry Tracking" },
                { href: "#terms", label: "Terms & Conditions" }
              ].map((link) => (
                <a 
                  key={link.href}
                  href={link.href} 
                  className="flex items-center transition-all text-base hover:translate-x-1 transform duration-200 group"
                  style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}
                >
                  <div className="w-1 h-4 bg-transparent group-hover:bg-blue-500 mr-3 transition-all duration-200 rounded"></div>
                  <span className="group-hover:text-blue-500 transition-colors">{link.label}</span>
                </a>
              ))}
              
              <a 
                href="/login" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center transition-all text-base hover:translate-x-1 transform duration-200 font-semibold mt-4 pt-4 border-t group"
                style={{ 
                  color: isDarkMode ? '#3b82f6' : '#2563eb',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'
                }}
              >
                <ArrowUpRight className="w-4 h-4 mr-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                Admin/Staff Login
              </a>
            </div>
          </div>

          {/* Map Section */}
          <div className="space-y-4 lg:col-span-1">
            <h3 
              className="font-bold text-lg tracking-wider"
              style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}
            >
              VISIT OUR SHOP
            </h3>
            <div 
              className="relative rounded-xl overflow-hidden shadow-lg border bg-slate-200 dark:bg-slate-900"
              style={{
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'
              }}
            >
              <div 
                className="absolute top-2 left-2 z-10 px-3 py-1 rounded text-sm font-bold shadow-lg flex items-center space-x-1"
                style={{
                  backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  color: isDarkMode ? '#3b82f6' : '#2563eb'
                }}
              >
                <MapPin className="w-3 h-3" />
                <span>STAR WASH</span>
              </div>
              <div className="absolute bottom-2 left-2 z-10 bg-black/80 text-white px-2 py-1 rounded text-xs">
                53A Bonifacio Street, Sta Lucia, Novaliches
              </div>
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d241.1938898713785!2d121.05287236601671!3d14.706809945501561!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b0ebba21a383%3A0x59da738019eaad7d!2s53%20Bonifacio%20St!5e0!3m2!1sen!2sph!4v1761076800930!5m2!1sen!2sph" 
                width="100%" 
                height="200"
                style={{ border: 0 }}
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="transition-all duration-300"
                title="Star Wash Laundry Location - 53A Bonifacio Street, Sta Lucia, Novaliches"
              />
            </div>
            <a 
              href="https://maps.google.com/?q=53A+Bonifacio+Street,+Sta+Lucia,+Novaliches,+Philippines"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center transition-all text-base group px-4 py-2 rounded-lg w-full border font-semibold"
              style={{
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
                color: isDarkMode ? '#f8fafc' : '#0f172a'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff';
                e.currentTarget.style.color = isDarkMode ? '#f8fafc' : '#0f172a';
                e.currentTarget.style.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)';
              }}
            >
              <MapPin className="w-4 h-4 mr-2" />
              <span>Get Directions</span>
              <ArrowUpRight className="w-4 h-4 ml-2 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div 
          className="border-t pt-6 text-center"
          style={{
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'
          }}
        >
          <p 
            className="text-base"
            style={{ color: isDarkMode ? '#64748b' : '#94a3b8' }}
          >
            © {new Date().getFullYear()} STAR WASH. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;