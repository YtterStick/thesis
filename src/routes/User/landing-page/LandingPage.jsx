import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Components
import Header from "@/routes/User/layouts/Header";
import Footer from "@/routes/User/layouts/Footer";

// Assets
import assetLanding from "@/assets/USER_ASSET/asset_landing.jpg";
import assetClothing from "@/assets/USER_ASSET/asset_clothing.png";

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const stats = [
    { number: "50", label: "Total Laundry Load" },
    { number: "15", label: "Total No. of Washing" },
    { number: "10", label: "Total No. of Drying" }
  ];

  const services = [
    {
      title: "Wash Only",
      description:
        "Our wash-only service includes the provision of detergent and softener, and ensures your clothes are thoroughly cleaned and fresh-smelling."
    },
    {
      title: "Dry Only",
      description:
        "Our dry-only service is focused solely on getting your clothes dried quickly and efficiently, using our high-capacity dryers."
    },
    {
      title: "Wash and Dry",
      description:
        "Our combined wash and dry service ensures your clothes are cleaned and dried in one seamless process, saving you time and effort."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B2B26] text-white font-poppins" id="home">
      <Header />

      <div className="h-24" />

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        className="relative w-full bg-[#0B2B26] mt-0"
      >
        <div className="relative max-w-[90%] mx-auto overflow-hidden bg-[#0B2B26] rounded-tl-2xl rounded-tr-2xl">
          
          <div className="relative">
            <img
              src={assetLanding}
              alt="Laundry scene"
              className="w-full h-[650px] object-cover rounded-tl-2xl rounded-tr-2xl"
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <motion.h2
                className="text-4xl md:text-6xl font-bold mb-12 leading-tight"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                style={{ color: '#183D3D' }}
              >
                Fresh Laundry,<br />
                <span className="font-light" style={{ color: '#183D3D' }}>Made Easy.</span>
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              >
                <button 
                  className="px-10 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 border-2 shadow-lg"
                  style={{ 
                    backgroundColor: '#D5DCDB',
                    color: '#183D3D',
                    borderColor: '#183D3D'
                  }}
                >
                  Our Service
                </button>
                <button 
                  className="px-10 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 border-2 shadow-lg"
                  style={{ 
                    backgroundColor: '#18442AF5',
                    color: '#D5DCDB',
                    borderColor: '#18442AF5'
                  }}
                >
                  My Laundry
                </button>
              </motion.div>
            </div>
          </div>

          <div className="absolute bottom-0 right-0 w-[500px] h-[180px] overflow-hidden">
            <svg
              className="absolute bottom-0 right-0 w-full h-full"
              viewBox="0 0 500 180"
              preserveAspectRatio="none"
            >
              <path
                d="M500,180 L500,100 Q500,0 500,0 L0,0 L0,180 Z"
                fill="#0B2B26"
              />
            </svg>

            <div className="absolute bottom-8 right-12 flex items-end justify-end space-x-12 z-10">
              {stats.map((stat, i) => (
                <div key={i} className="text-center flex flex-col items-center">
                  <div className="text-6xl font-bold text-white mb-1">{stat.number}</div>
                  <div className="text-sm font-normal text-white/80 max-w-[140px] leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="py-20 px-4 bg-[#0B2B26]"
        id="services"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-white">
            Our <span className="text-white font-light">Services</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.4 + index * 0.2 }}
                className="bg-[#1C3F3A] rounded-2xl p-8 border-2 border-[#2A524C] hover:border-white/30 hover:shadow-2xl transition-all duration-300 h-full flex flex-col"
              >
                <h3 className="text-2xl font-bold text-white mb-6 text-center">
                  {service.title}
                </h3>
                <p className="text-white/90 leading-relaxed text-lg flex-grow">
                  {service.description}
                </p>
                <div className="text-center mt-6">
                  <button className="text-white hover:text-white font-semibold text-lg border-b-2 border-white hover:border-white transition-all py-1">
                    Details →
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <section
        className="bg-[#1C3F3A] py-12 text-center text-white"
        id="contact"
      >
        <h3 className="text-2xl font-bold mb-4">Contact Us</h3>
        <p className="text-lg">STAR WASH</p>
        <p className="text-lg">2023 Templerhill, KL, 60017 Malaysia</p>
        <p className="text-lg">Email: starwash@email.com</p>
        <p className="text-lg">Phone: +60 123 456 789</p>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;