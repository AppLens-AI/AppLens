import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Maximize2,
  Download,
  Smartphone,
  Palette,
  Type,
  Image,
  Layers,
  Shield,
} from "lucide-react";

const highlights = [
  {
    icon: Maximize2,
    title: "Custom Dimensions",
    description:
      "Set exact pixel dimensions for any app store requirement. Supports all iPhone, Android, iPad, and desktop sizes.",
    color: "from-emerald-500/20 to-teal-500/20",
  },
  {
    icon: Download,
    title: "One-Click Export",
    description:
      "Export all slides as high-quality PNG images with a single click. Batch download as a ZIP archive.",
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: Smartphone,
    title: "Device Previews",
    description:
      "See your screenshots inside realistic device frames. iPhone, Android, iPad — all pixel-perfect.",
    color: "from-purple-500/20 to-violet-500/20",
  },
  {
    icon: Palette,
    title: "Gradient Backgrounds",
    description:
      "Choose from beautiful preset gradients or create your own. Solid colors, linear, and radial gradients supported.",
    color: "from-pink-500/20 to-rose-500/20",
  },
  {
    icon: Type,
    title: "Text Overlays",
    description:
      "Add headlines and descriptions with full font control. Position, size, color, and style exactly how you want.",
    color: "from-amber-500/20 to-orange-500/20",
  },
  {
    icon: Image,
    title: "Background Images",
    description:
      "Upload custom background images or use our built-in collection. Add blur, overlay, and opacity effects.",
    color: "from-indigo-500/20 to-blue-500/20",
  },
  {
    icon: Layers,
    title: "Multi-Slide Projects",
    description:
      "Organize your screenshots into multi-slide projects. Perfect for creating complete App Store listing sets.",
    color: "from-teal-500/20 to-emerald-500/20",
  },
  {
    icon: Shield,
    title: "Cloud Saved",
    description:
      "All your projects are saved securely in the cloud. Access them from anywhere, anytime.",
    color: "from-slate-500/20 to-gray-500/20",
  },
];

const HighlightCard = ({
  highlight,
  index,
}: {
  highlight: (typeof highlights)[0];
  index: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.08, duration: 0.5, ease: "easeOut" }}
      className="group relative"
    >
      <div className="relative h-full p-6 rounded-2xl bg-card/30 border border-border/40 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 hover:bg-card/50">
        {/* Subtle gradient bg on hover */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${highlight.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
        />

        <div className="relative z-10">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <highlight.icon className="w-6 h-6 text-primary" />
          </div>

          <h3 className="font-display text-lg font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
            {highlight.title}
          </h3>

          <p className="text-muted-foreground text-sm leading-relaxed">
            {highlight.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const FeatureHighlights = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 md:py-32 px-4 relative" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/20 to-transparent" />

      <div className="container max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
            Packed with Power
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
            Every Feature You
            <span className="gradient-text block">Could Ask For</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We've built every tool you need to create professional app
            screenshots, all in one streamlined platform.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {highlights.map((highlight, index) => (
            <HighlightCard
              key={highlight.title}
              highlight={highlight}
              index={index}
            />
          ))}
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-16 md:mt-20 glass-card p-6 md:p-8 rounded-2xl"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { value: "10+", label: "Templates" },
              { value: "8+", label: "Device Frames" },
              { value: "∞", label: "Custom Sizes" },
              { value: "PNG", label: "Export Format" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
                className="text-center"
              >
                <div className="font-display text-3xl md:text-4xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureHighlights;
