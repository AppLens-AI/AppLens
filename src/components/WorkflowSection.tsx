import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Upload, Paintbrush, Download, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Upload,
    number: "01",
    title: "Upload Screenshot",
    description: "Drag and drop your app screenshot or paste from clipboard.",
  },
  {
    icon: Paintbrush,
    number: "02",
    title: "Choose Style",
    description: "Pick a template and customize colors, frames, and effects.",
  },
  {
    icon: Sparkles,
    number: "03",
    title: "AI Enhancement",
    description: "Let AI optimize composition and suggest improvements.",
  },
  {
    icon: Download,
    number: "04",
    title: "Export & Share",
    description: "Download high-quality images ready for any platform.",
  },
];

const StepCard = ({
  step,
  index,
}: {
  step: (typeof steps)[0];
  index: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.2, duration: 0.6, ease: "easeOut" }}
      className="relative"
    >
      {index < steps.length - 1 && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ delay: index * 0.2 + 0.5, duration: 0.8 }}
          className="absolute top-10 left-[35%] hidden lg:block w-full h-0.5 origin-left"
          style={{
            background:
              "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.3) 50%, transparent 100%)",
          }}
        />
      )}

      <div className="text-center lg:text-left">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={isInView ? { scale: 1, rotate: 0 } : {}}
          transition={{ delay: index * 0.2, duration: 0.5, type: "spring" }}
          className="relative inline-flex"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center relative z-10 group-hover:bg-primary/20 transition-colors">
            <step.icon className="w-8 h-8 text-primary" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
            className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl"
          />
        </motion.div>

        <motion.span
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: index * 0.2 + 0.3, duration: 0.4 }}
          className="block text-5xl font-display font-bold text-primary/20 mt-4"
        >
          {step.number}
        </motion.span>

        <h3 className="font-display text-xl font-semibold mt-2 mb-3 text-foreground">
          {step.title}
        </h3>

        <p className="text-muted-foreground max-w-xs mx-auto lg:mx-0">
          {step.description}
        </p>
      </div>
    </motion.div>
  );
};

const WorkflowSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-32 px-4 relative" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/30 to-transparent" />

      <div className="container max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
            Simple Workflow
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
            Four Steps to
            <span className="gradient-text block">Perfect Screenshots</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Creating professional app visuals has never been easier. Follow
            these simple steps.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {steps.map((step, index) => (
            <StepCard key={step.number} step={step} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;
