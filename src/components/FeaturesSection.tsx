import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Layers, Palette, Zap, Smartphone, Download, Wand2 } from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "Beautiful Templates",
    description: "Choose from 50+ professionally designed templates that make your screenshots pop.",
  },
  {
    icon: Palette,
    title: "Custom Styling",
    description: "Personalize every detail – colors, gradients, shadows, and backgrounds.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Generate stunning visuals in seconds, not hours. No rendering wait times.",
  },
  {
    icon: Smartphone,
    title: "Device Frames",
    description: "Showcase your app in realistic iPhone, Android, and desktop frames.",
  },
  {
    icon: Download,
    title: "Export Anywhere",
    description: "Download in PNG, JPG, or WebP. Perfect for App Store, web, and social media.",
  },
  {
    icon: Wand2,
    title: "AI-Powered",
    description: "Let AI suggest the perfect composition and styling for your screenshots.",
  },
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, rotateX: -10 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ 
        delay: index * 0.1, 
        duration: 0.6,
        ease: "easeOut"
      }}
      whileHover={{ 
        y: -10, 
        rotateY: 5,
        transition: { duration: 0.3 }
      }}
      style={{ perspective: 1000 }}
      className="group"
    >
      <div className="glass-card p-8 h-full relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none"
        />
        
        <motion.div
          whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors"
        >
          <feature.icon className="w-7 h-7 text-primary" />
        </motion.div>

        <h3 className="font-display text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors">
          {feature.title}
        </h3>
        
        <p className="text-muted-foreground leading-relaxed">
          {feature.description}
        </p>

        <motion.div
          initial={{ scaleX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent origin-left"
        />
      </div>
    </motion.div>
  );
};

const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-32 px-4 relative" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-subtle/30 to-transparent" />

      <div className="container max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
            Powerful Features
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
            Everything You Need to
            <span className="gradient-text block">Create Magic</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Our tool comes packed with features that make screenshot creation effortless and beautiful.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;