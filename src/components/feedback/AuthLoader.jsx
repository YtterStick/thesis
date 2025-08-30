import React from "react";
import Lottie from "lottie-react";
import waterLoadingAnimation from "@/assets/lottie/water-loading.json"; // Replace with your actual path
import { animated, useSpring } from "@react-spring/web";

const AuthLoader = () => {
  const fadeIn = useSpring({
    from: { opacity: 0, scale: 0.95 },
    to: { opacity: 1, scale: 1 },
    config: { duration: 500 },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <animated.div
        style={fadeIn}
        className="relative z-10 flex flex-col items-center justify-center"
      >
        {/* 🌊 Enlarged Water-themed Lottie animation */}
        <div className="h-64 w-64">
          <Lottie
            animationData={waterLoadingAnimation}
            loop
            autoplay
            className="h-full w-full"
          />
        </div>
      </animated.div>
    </div>
  );
};

export default AuthLoader;