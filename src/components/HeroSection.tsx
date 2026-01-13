import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const TypewriterText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }
    }, currentIndex === 0 ? delay : 50);

    return () => clearTimeout(timeout);
  }, [currentIndex, text, delay]);

  return (
    <span>
      {displayText}
      {currentIndex < text.length && (
        <span className="animate-pulse text-primary">|</span>
      )}
    </span>
  );
};

const FloatingScreen = ({ 
  className, 
  delay, 
  mouseX, 
  mouseY,
  intensity = 1
}: { 
  className?: string; 
  delay: number;
  mouseX: any;
  mouseY: any;
  intensity?: number;
}) => {
  const x = useTransform(mouseX, [-500, 500], [-20 * intensity, 20 * intensity]);
  const y = useTransform(mouseY, [-500, 500], [-20 * intensity, 20 * intensity]);
  const springX = useSpring(x, { stiffness: 50, damping: 20 });
  const springY = useSpring(y, { stiffness: 50, damping: 20 });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.8, ease: "easeOut" }}
      style={{ x: springX, y: springY }}
      className={className}
    >
      <div className="glass-card p-2 floating-shape">
        <div className="bg-secondary rounded-lg overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/50">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
          </div>
          <div className="p-4 space-y-2">
            <div className="h-3 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-8 bg-primary/20 rounded-lg mt-3" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  return (
    <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-4"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-dark/20 via-transparent to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute top-20 left-[10%] w-20 h-20 bg-primary/20 rounded-full blur-xl floating-shape"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-40 right-[15%] w-32 h-32 bg-primary/15 rounded-full blur-2xl floating-shape-slow"
      />

      <FloatingScreen 
        className="absolute top-[20%] left-[5%] w-48 md:w-64 opacity-60" 
        delay={0.5} 
        mouseX={mouseX}
        mouseY={mouseY}
        intensity={0.5}
      />
      <FloatingScreen 
        className="absolute top-[15%] right-[8%] w-40 md:w-56 opacity-50" 
        delay={0.7} 
        mouseX={mouseX}
        mouseY={mouseY}
        intensity={0.7}
      />
      <FloatingScreen 
        className="absolute bottom-[20%] left-[12%] w-36 md:w-48 opacity-40" 
        delay={0.9} 
        mouseX={mouseX}
        mouseY={mouseY}
        intensity={0.6}
      />
      <FloatingScreen 
        className="absolute bottom-[25%] right-[5%] w-44 md:w-52 opacity-55" 
        delay={1.1} 
        mouseX={mouseX}
        mouseY={mouseY}
        intensity={0.8}
      />

      <div className="relative z-10 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">Next-Gen Screenshot Generator</span>
        </motion.div>

        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="block text-foreground"
          >
            <TypewriterText text="Transform Your Apps" delay={300} />
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="block gradient-text"
          >
            <TypewriterText text="Into Stunning Visuals" delay={1800} />
          </motion.span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Create beautiful, professional app screenshots in seconds. 
          No design skills required – just pure visual magic.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button 
            size="lg" 
            className="glow-button pulse-glow bg-primary hover:bg-primary text-primary-foreground px-8 py-6 text-lg font-semibold rounded-xl group"
          >
            <span className="relative z-10 flex items-center gap-2">
              Start Creating Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="px-8 py-6 text-lg font-semibold rounded-xl border-border/50 hover:bg-secondary/50"
          >
            Watch Demo
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-16 flex items-center justify-center gap-8 text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-secondary border-2 border-background" />
              ))}
            </div>
            <span className="text-sm">10k+ users</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm">⭐ 4.9 rating</span>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm">Free to start</span>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;