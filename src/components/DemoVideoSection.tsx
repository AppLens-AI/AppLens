import { motion, useInView } from "framer-motion";
import { useRef, useState, useCallback } from "react";
import { Play, Pause, Maximize2, Volume2, VolumeX } from "lucide-react";

const DemoVideoSection = () => {
  const sectionRef = useRef(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * v.duration;
  }, []);

  const handleFullscreen = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen();
  }, []);

  return (
    <section
      className="py-24 md:py-32 px-4 relative overflow-hidden"
      ref={sectionRef}
    >
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/8 rounded-full blur-[100px]" />
      </div>

      <div className="container max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
            See It In Action
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
            Watch How It
            <span className="gradient-text block">All Comes Together</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A quick walkthrough showing you how to go from a blank canvas to
            stunning, store-ready screenshots in minutes.
          </p>
        </motion.div>

        {/* Video Player */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="relative max-w-4xl mx-auto"
        >
          {/* Glow behind video */}
          <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl" />

          <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-black/40 bg-black">
            {/* The actual video */}
            <video
              ref={videoRef}
              src="/demo.mov"
              muted
              playsInline
              preload="metadata"
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              onClick={togglePlay}
              className="w-full aspect-video object-cover cursor-pointer"
            />

            {/* Big centered play button — shown when paused */}
            {!isPlaying && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, type: "spring" }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] cursor-pointer group"
              >
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute inset-0 bg-primary/30 rounded-full blur-xl scale-150"
                  />
                  <div className="relative w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:bg-primary transition-colors">
                    <Play className="w-8 h-8 text-primary-foreground ml-1" />
                  </div>
                </div>
              </motion.button>
            )}

            {/* Bottom controls bar */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-10 pb-3 px-4 opacity-0 hover:opacity-100 transition-opacity duration-300"
              style={{
                pointerEvents: isPlaying ? "auto" : "none",
                opacity: isPlaying ? undefined : 0,
              }}
            >
              {/* Progress bar */}
              <div
                className="w-full h-1.5 rounded-full bg-white/20 mb-3 cursor-pointer group"
                onClick={handleSeek}
              >
                <div
                  className="h-full rounded-full bg-primary relative transition-[width] duration-100"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-primary border-2 border-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="text-white hover:text-primary transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={toggleMute}
                    className="text-white hover:text-primary transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <button
                  onClick={handleFullscreen}
                  className="text-white hover:text-primary transition-colors"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Timeline markers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex items-center justify-center gap-6 mt-8 flex-wrap"
          >
            {[
              { time: "0:00", label: "Create Project" },
              { time: "0:30", label: "Add Slides" },
              { time: "1:00", label: "Customize Design" },
              { time: "1:30", label: "Export Results" },
            ].map((point, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-primary font-mono font-medium">
                  {point.time}
                </span>
                <span className="text-muted-foreground">{point.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default DemoVideoSection;
