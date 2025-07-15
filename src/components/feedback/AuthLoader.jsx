import { useSprings, animated, useSpring } from "@react-spring/web";
import chibiAsset from "@/assets/chibiAsset.png";

const AuthLoader = () => {
  // Bouncing dots animation
  const springs = useSprings(
    3,
    Array(3)
      .fill()
      .map((_, i) => ({
        from: { transform: "translateY(0px)" },
        to: async (next) => {
          while (1) {
            await next({ transform: "translateY(-10px)" });
            await next({ transform: "translateY(0px)" });
          }
        },
        delay: i * 200,
        config: { tension: 200, friction: 12 },
      }))
  );

  // Floating chibi Vader animation
  const float = useSpring({
    loop: true,
    from: { transform: "translateY(0px)" },
    to: [
      { transform: "translateY(-12px)" },
      { transform: "translateY(0px)" },
    ],
    config: { tension: 120, friction: 14 },
  });

  // Fade-in animation for the whole loader block
  const fadeIn = useSpring({
    from: { opacity: 0, scale: 0.95 },
    to: { opacity: 1, scale: 1 },
    config: { duration: 500 },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <animated.div
        style={fadeIn}
        className="relative z-10 flex flex-col items-center justify-center gap-6 text-center"
      >
        {/* Chibi Vader floating above */}
        <animated.img
          src={chibiAsset}
          alt="Chibi Darth Vader"
          style={float}
          className="h-28 w-auto drop-shadow-[0_0_16px_#3DD9B6]"
        />

        {/* Caption */}
        <p className="font-starjedi text-xl uppercase tracking-[0.25em] text-[#3DD9B6] drop-shadow-[0_0_8px_#3DD9B6]">
          Systems Authenticating...
        </p>

        {/* Bouncing dots */}
        <div className="flex gap-4">
          {springs.map((style, index) => (
            <animated.div
              key={index}
              style={style}
              className="h-5 w-5 rounded-full bg-[#3DD9B6] shadow-[0_0_12px_#3DD9B6]"
            />
          ))}
        </div>
      </animated.div>
    </div>
  );
};

export default AuthLoader;