import { MapPin, Phone, Mail, Clock, ArrowUpRight } from 'lucide-react';

// Footer component
const Footer = ({ isDarkMode }) => {
  return (
    <footer className="bg-[#1C3F3A] border-t border-[#0B2B26]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Top Section - Brand & Map Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Brand & Contact */}
          <div className="space-y-4 lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              {/* Replace SW text with GIF logo */}
              <div className="w-10 h-10 bg-[#F3EDE3] rounded-lg flex items-center justify-center shadow-lg overflow-hidden">
                <img
                  src="/logo.gif"
                  alt="Star Wash Logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="font-deathstar text-2xl text-[#F3EDE3] tracking-wider">
                STAR WASH
              </span>
            </div>
            <p className="text-[#F3EDE3] text-lg font-semibold tracking-wide mb-2">
              FRESH LAUNDRY, MADE EASY
            </p>
            
            <div className="space-y-3 text-[#F3EDE3]/80 text-base">
              <div className="flex items-start space-x-3">
                <Mail className="w-4 h-4 text-[#F3EDE3] mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-[#F3EDE3]">Email</p>
                  <p>starwashph_stalucia@gmail.com</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Phone className="w-4 h-4 text-[#F3EDE3] mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-[#F3EDE3]">Phone</p>
                  <p>09150475513</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="w-4 h-4 text-[#F3EDE3] mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-[#F3EDE3]">Business Hours</p>
                  <p>Monday - Sunday</p>
                  <p>7:00 AM - 7:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links - Single Column */}
          <div className="space-y-4 lg:col-span-1">
            <h3 className="text-[#F3EDE3] font-semibold text-lg">QUICK NAVIGATION</h3>
            <div className="space-y-3">
              <a 
                href="#home" 
                className="flex items-center text-[#F3EDE3]/80 hover:text-[#F3EDE3] transition-all text-base hover:translate-x-1 transform duration-200 group"
              >
                <div className="w-1 h-4 bg-transparent group-hover:bg-[#F3EDE3] mr-3 transition-all duration-200 rounded"></div>
                Home
              </a>
              <a 
                href="#services" 
                className="flex items-center text-[#F3EDE3]/80 hover:text-[#F3EDE3] transition-all text-base hover:translate-x-1 transform duration-200 group"
              >
                <div className="w-1 h-4 bg-transparent group-hover:bg-[#F3EDE3] mr-3 transition-all duration-200 rounded"></div>
                Services & Pricing
              </a>
              <a 
                href="#service_tracking" 
                className="flex items-center text-[#F3EDE3]/80 hover:text-[#F3EDE3] transition-all text-base hover:translate-x-1 transform duration-200 group"
              >
                <div className="w-1 h-4 bg-transparent group-hover:bg-[#F3EDE3] mr-3 transition-all duration-200 rounded"></div>
                Laundry Tracking
              </a>
              <a 
                href="#terms" 
                className="flex items-center text-[#F3EDE3]/80 hover:text-[#F3EDE3] transition-all text-base hover:translate-x-1 transform duration-200 group"
              >
                <div className="w-1 h-4 bg-transparent group-hover:bg-[#F3EDE3] mr-3 transition-all duration-200 rounded"></div>
                Terms & Conditions
              </a>
              <a 
                href="https://www.starwashph.com/login" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-[#F3EDE3] hover:text-white transition-all text-base hover:translate-x-1 transform duration-200 font-medium mt-4 pt-4 border-t border-[#0B2B26] group"
              >
                <ArrowUpRight className="w-4 h-4 mr-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                Admin/Staff Login
              </a>
            </div>
          </div>

          {/* Map Section */}
          <div className="space-y-4 lg:col-span-1">
            <h3 className="text-[#F3EDE3] font-semibold text-lg">VISIT OUR SHOP</h3>
            <div className="relative rounded-lg overflow-hidden shadow-lg border-2 border-[#0B2B26] bg-[#0B2B26]">
              <div className="absolute top-2 left-2 z-10 bg-[#F3EDE3] text-[#0B2B26] px-3 py-1 rounded text-sm font-bold shadow-lg flex items-center space-x-1">
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
              className="inline-flex items-center justify-center text-[#F3EDE3] hover:text-white transition-all text-base group bg-[#0B2B26] hover:bg-[#14332e] px-4 py-2 rounded-lg w-full border border-[#2A524C]"
            >
              <MapPin className="w-4 h-4 mr-2" />
              <span>Get Directions</span>
              <ArrowUpRight className="w-4 h-4 ml-2 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-[#0B2B26] pt-6 text-center">
          <p className="text-[#F3EDE3]/60 text-base">
            © 2025 STAR WASH. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;