import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const LaundryProgress = ({ 
  isVisible,
  isDarkMode, 
  isMobile, 
  currentLoadIndex, 
  laundryLoads, 
  prevLoad, 
  nextLoad, 
  goToLoad 
}) => {
  if (!isVisible) return null;

  const currentLoad = laundryLoads[currentLoadIndex];
  const currentStep = currentLoad.statusSteps.find(step => step.active) || currentLoad.statusSteps[0];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.5 }}
      className="mb-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <h3 className="text-lg md:text-xl font-bold text-center sm:text-left"
          style={{ color: isDarkMode ? '#13151B' : '#F3EDE3' }}>
          Laundry Progress
        </h3>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div 
            className="text-sm font-semibold px-3 py-1 rounded-lg border"
            style={{
              backgroundColor: isDarkMode ? '#FFFFFF' : '#183D3D',
              color: isDarkMode ? '#18442A' : '#F3EDE3',
              borderColor: isDarkMode ? '#2A524C' : '#F3EDE3'
            }}>
            Load {currentLoadIndex + 1} of {laundryLoads.length}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={prevLoad}
              disabled={currentLoadIndex === 0}
              className="p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105"
              style={{ 
                backgroundColor: currentLoadIndex === 0 ? '#E5E7EB' : (isDarkMode ? '#18442A' : '#F3EDE3'),
                color: currentLoadIndex === 0 ? '#6B7280' : (isDarkMode ? '#FFFFFF' : '#183D3D'),
                border: `2px solid ${isDarkMode ? '#2A524C' : '#F3EDE3'}`
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex gap-1 mx-2">
              {laundryLoads.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToLoad(index)}
                  className={`w-3 h-3 rounded-full transition-all border ${
                    index === currentLoadIndex 
                      ? (isDarkMode ? 'bg-[#18442A]' : 'bg-[#F3EDE3]') + ' scale-125 border-white shadow-lg'
                      : 'bg-gray-300 hover:bg-gray-400 border-gray-400'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={nextLoad}
              disabled={currentLoadIndex === laundryLoads.length - 1}
              className="p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105"
              style={{ 
                backgroundColor: currentLoadIndex === laundryLoads.length - 1 ? '#E5E7EB' : (isDarkMode ? '#18442A' : '#F3EDE3'),
                color: currentLoadIndex === laundryLoads.length - 1 ? '#6B7280' : (isDarkMode ? '#FFFFFF' : '#183D3D'),
                border: `2px solid ${isDarkMode ? '#2A524C' : '#F3EDE3'}`
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div 
        className="rounded-lg border-2 p-3 mb-3"
        style={{
          backgroundColor: isDarkMode ? '#FFFFFF' : '#183D3D',
          borderColor: isDarkMode ? '#2A524C' : '#F3EDE3',
          color: isDarkMode ? '#13151B' : '#F3EDE3'
        }}
      >
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div>
            <span className="text-xs">
              Load Number
            </span>
            <p className="font-semibold">
              {currentLoad.loadNumber}
            </p>
          </div>
          <div>
            <span className="text-xs">
              Fabric
            </span>
            <p className="font-semibold">
              {currentLoad.fabricType}
            </p>
          </div>
          <div>
            <span className="text-xs">
              Detergent
            </span>
            <p className="font-semibold">
              {currentLoad.detergent}
            </p>
          </div>
        </div>
      </div>

      {isMobile && (
        <div 
          className="rounded-lg border-2 p-3"
          style={{
            backgroundColor: isDarkMode ? '#FFFFFF' : '#183D3D',
            borderColor: isDarkMode ? '#2A524C' : '#F3EDE3',
            color: isDarkMode ? '#13151B' : '#F3EDE3'
          }}
        >
          <div className="text-center mb-3">
            <div className="w-12 h-12 mx-auto mb-2">
              <Lottie 
                animationData={currentStep.lottie}
                loop={currentStep.active}
                autoplay={true}
              />
            </div>
            <h4 className="font-semibold text-sm mb-1">
              {currentStep.title}
            </h4>
            <p className="text-xs mb-2">
              {currentStep.description}
            </p>
            {currentStep.startedAt && (
              <p className="text-xs font-semibold">
                Started at: {currentStep.startedAt}
              </p>
            )}
          </div>
          
          <div className="p-2 rounded-lg text-center text-xs"
            style={{
              backgroundColor: isDarkMode ? '#18442A' : '#F3EDE3',
              color: isDarkMode ? '#FFFFFF' : '#183D3D'
            }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <div 
                className="w-1 h-1 rounded-full animate-pulse" 
                style={{ backgroundColor: isDarkMode ? '#FFFFFF' : '#183D3D' }}
              />
              <span className="font-semibold">Live</span>
            </div>
            <p className="font-semibold">EST: {currentStep.estimatedTime}</p>
          </div>
        </div>
      )}

      {!isMobile && (
        <>
          <div className="relative mb-4">
            <div className="absolute top-8 left-0 right-0 h-1 bg-gray-300 z-10"></div>
            <div 
              className="absolute top-8 left-0 h-1 z-20 transition-all duration-500"
              style={{ 
                width: `${(currentLoad.statusSteps.findIndex(s => s.active) + 1) / currentLoad.statusSteps.length * 100}%`,
                backgroundColor: isDarkMode ? '#18442A' : '#F3EDE3'
              }}
            ></div>

            <div className="relative z-30 grid grid-cols-4 gap-2">
              {currentLoad.statusSteps.map((step, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full border-3 mb-4 z-30 ${
                    step.active 
                      ? (isDarkMode ? 'bg-[#18442A] border-[#18442A]' : 'bg-[#F3EDE3] border-[#F3EDE3]') + ' scale-110'
                      : index < currentLoad.statusSteps.findIndex(s => s.active) 
                        ? (isDarkMode ? 'bg-[#18442A] border-[#18442A]' : 'bg-[#F3EDE3] border-[#F3EDE3]')
                        : 'bg-white border-gray-300'
                  } transition-all duration-300`}></div>

                  <div className={`mb-2 transition-all duration-300 ${
                    step.active ? 'scale-110' : 'opacity-50 grayscale'
                  }`}>
                    <div className="w-12 h-12 flex items-center justify-center">
                      <Lottie 
                        animationData={step.lottie}
                        loop={step.active}
                        autoplay={true}
                        style={{ 
                          width: step.active ? 48 : 40,
                          height: step.active ? 48 : 40
                        }}
                      />
                    </div>
                  </div>

                  <div className="text-center w-full px-1">
                    <h4 className={`font-semibold mb-1 text-xs leading-tight ${
                      step.active ? (isDarkMode ? "text-[#13151B]" : "text-[#F3EDE3]") : (isDarkMode ? "text-[#6B7280]" : "text-[#F3EDE3]")
                    }`}>
                      {step.title}
                    </h4>
                    <p className={`text-xs mb-2 leading-tight ${
                      step.active ? (isDarkMode ? "text-[#6B7280]" : "text-[#F3EDE3]") : (isDarkMode ? "text-[#93A29F]" : "text-[#F3EDE3]")
                    }`}>
                      {step.description}
                    </p>
                    
                    {step.startedAt && (
                      <p className="text-xs mb-1 font-semibold">
                          Started: {step.startedAt}
                      </p>
                    )}
                    
                    <div className={`p-1 rounded font-semibold text-xs min-h-[2rem] flex items-center justify-center ${
                      step.active 
                        ? (isDarkMode ? "text-white" : "text-[#183D3D]") 
                        : "bg-gray-200 text-gray-600"
                    }`}
                    style={{
                      backgroundColor: step.active ? (isDarkMode ? '#18442A' : '#F3EDE3') : undefined
                    }}>
                      <span className="text-center leading-tight">
                        EST: {step.estimatedTime}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div 
            className="mt-4 p-3 rounded-lg border text-center"
            style={{
              backgroundColor: isDarkMode ? '#FFFFFF' : '#183D3D',
              borderColor: isDarkMode ? '#2A524C' : '#F3EDE3',
              color: isDarkMode ? '#13151B' : '#F3EDE3'
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <div 
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: isDarkMode ? '#18442A' : '#F3EDE3' }} 
              />
              <p className="font-semibold text-sm">
                Total Estimated Time: ~2 hours
              </p>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default LaundryProgress;