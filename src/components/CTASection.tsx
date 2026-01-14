import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const FloatingShape = ({ 
  className, 
  size, 
  delay,
  duration = 20
}: { 
  className?: string; 
  size: number;
  delay: number;
  duration?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: 0.3,
      scale: 1,
      rotate: 360,
    }}
    transition={{ 
      opacity: { delay, duration: 1 },
      scale: { delay, duration: 1 },
      rotate: { duration, repeat: Infinity, ease: "linear" }
    }}
    className={className}
    style={{ width: size, height: size }}
  />
);

const CTASection = () => {
  const ref = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springX = useSpring(mouseX, { stiffness: 20, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 20, damping: 30 });
  
  const x1 = useTransform(springX, [-500, 500], [-30, 30]);
  const y1 = useTransform(springY, [-500, 500], [-30, 30]);
  const x2 = useTransform(springX, [-500, 500], [20, -20]);
  const y2 = useTransform(springY, [-500, 500], [20, -20]);

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
      ref={ref}
      className="py-32 px-4 relative overflow-hidden"
    >
      <motion.div 
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(ellipse 80% 60% at 50% 50%, hsl(160 84% 25% / 0.4), transparent)',
            'radial-gradient(ellipse 60% 80% at 40% 60%, hsl(160 84% 30% / 0.4), transparent)',
            'radial-gradient(ellipse 80% 60% at 60% 40%, hsl(160 84% 25% / 0.4), transparent)',
            'radial-gradient(ellipse 80% 60% at 50% 50%, hsl(160 84% 25% / 0.4), transparent)',
          ]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      <motion.div style={{ x: x1, y: y1 }} className="absolute top-20 left-[10%]">
        <FloatingShape 
          className="rounded-full border-2 border-primary/30" 
          size={100} 
          delay={0.2}
        />
      </motion.div>
      <motion.div style={{ x: x2, y: y2 }} className="absolute bottom-20 right-[15%]">
        <FloatingShape 
          className="rounded-2xl bg-primary/10" 
          size={80} 
          delay={0.4}
          duration={25}
        />
      </motion.div>
      <motion.div style={{ x: x1, y: y2 }} className="absolute top-40 right-[20%]">
        <FloatingShape 
          className="rounded-full bg-primary/20" 
          size={50} 
          delay={0.6}
          duration={15}
        />
      </motion.div>
      <motion.div style={{ x: x2, y: y1 }} className="absolute bottom-40 left-[20%]">
        <FloatingShape 
          className="rounded-lg border border-primary/20" 
          size={60} 
          delay={0.8}
          duration={18}
        />
      </motion.div>

      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="container max-w-4xl mx-auto relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Start for Free Today</span>
          </motion.div>

          <h2 className="font-display text-4xl md:text-6xl font-bold mb-6">
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="block text-foreground"
            >
              Ready to Create
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="block gradient-text"
            >
              Stunning Screenshots?
            </motion.span>
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Join thousands of developers and designers who create beautiful app visuals with our tool. No credit card required.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button 
              size="lg" 
              className="glow-button pulse-glow bg-primary hover:bg-primary text-primary-foreground px-10 py-7 text-lg font-semibold rounded-xl group"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-10 py-7 text-lg font-semibold rounded-xl border-border/50 hover:bg-secondary/50"
            >
              View Pricing
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-muted-foreground text-sm"
          >
            <span>✓ No credit card required</span>
            <span>✓ Free plan available</span>
            <span>✓ Cancel anytime</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;