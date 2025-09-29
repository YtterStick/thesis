// Footer component
const Footer = () => {
  return (
    <footer className="bg-[#1C3F3A] border-t border-[#0B2B26]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#F3EDE3] rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-[#0B2B26] font-bold text-base">SW</span>
              </div>
              <span className="font-deathstar text-2xl text-[#F3EDE3] tracking-wider">
                STAR WASH
              </span>
            </div>
            <p className="text-[#F3EDE3] text-xl font-semibold tracking-wide">
              FRESH LAUNDRY, MADE EASY
            </p>
            <p className="text-[#F3EDE3]/80 text-lg">
              53 A Bonifacio Street, Sta Lucia, Novaliches, Philippines
            </p>
          </div>

          {/* Contact Section */}
          <div className="space-y-6">
            <h3 className="text-[#F3EDE3] font-semibold text-xl">CONTACT</h3>
            <div className="space-y-3 text-[#F3EDE3]/80 text-lg">
              <p>EMAIL: AIGANGSHAR@SMACL.COM</p>
              <p>PHONE: 0999922497</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-[#F3EDE3] font-semibold text-xl">QUICK LINKS</h3>
            <div className="space-y-3">
              <a href="#services" className="block text-[#F3EDE3]/80 hover:text-[#F3EDE3] transition-colors text-lg">Our Services</a>
              <a href="#tracking" className="block text-[#F3EDE3]/80 hover:text-[#F3EDE3] transition-colors text-lg">Service Tracking</a>
              <a href="#receipt" className="block text-[#F3EDE3]/80 hover:text-[#F3EDE3] transition-colors text-lg">Receipt Management</a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-[#0B2B26] mt-12 pt-8 text-center">
          <p className="text-[#F3EDE3]/60 text-lg">
            © 2025 STARWASH. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;