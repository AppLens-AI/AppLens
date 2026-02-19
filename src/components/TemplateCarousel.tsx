import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { templatesApi } from "@/lib/api";
import type { Template } from "@/types";
import { Loader2 } from "lucide-react";

const ImageCard = ({ src, alt }: { src: string; alt: string }) => (
  <div className="flex-shrink-0 w-[240px] md:w-[280px] group cursor-pointer">
    <div className="relative overflow-hidden rounded-2xl border border-border/30 transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-xl group-hover:shadow-primary/10 group-hover:scale-[1.03]">
      <div className="aspect-[9/19] bg-secondary/40 relative overflow-hidden">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          draggable={false}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/5 rounded-2xl" />
      </div>
    </div>
  </div>
);

const TemplateCarousel = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPaused = useRef(false);
  const speed = 0.5;

  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ["landing-templates"],
    queryFn: async () => {
      const res = await templatesApi.getAll();
      return (res.data.data || []) as Template[];
    },
    staleTime: 1000 * 60 * 10,
  });

  const allImages = useMemo(() => {
    const images: { src: string; alt: string }[] = [];
    templates.forEach((t) => {
      (t.thumbnails ?? []).forEach((thumb, idx) => {
        images.push({ src: thumb, alt: `${t.name} — slide ${idx + 1}` });
      });
    });
    return images;
  }, [templates]);

  const tripled = useMemo(
    () => [...allImages, ...allImages, ...allImages],
    [allImages],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || allImages.length === 0) return;

    let raf: number;
    let pos = 0;

    const start = () => {
      const singleSetWidth = el.scrollWidth / 3;

      const step = () => {
        if (!isPaused.current) {
          pos += speed;
          if (pos >= singleSetWidth) pos -= singleSetWidth;
          el.scrollLeft = pos;
        }
        raf = requestAnimationFrame(step);
      };

      raf = requestAnimationFrame(step);
    };

    const timer = setTimeout(start, 200);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [allImages]);

  return (
    <section
      className="py-24 md:py-32 relative overflow-hidden"
      ref={ref}
      id="templates"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />

      <div className="container max-w-6xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
            Template Gallery
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
            Beautiful Templates,
            <span className="gradient-text block">Ready to Customize</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Browse our collection of professionally designed templates. Each one
            is fully customizable — pick one and make it yours.
          </p>
        </motion.div>
      </div>

      {/* Carousel container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative"
      >
        {/* Left blur overlay */}
        <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 z-10 bg-gradient-to-r from-background via-background/80 to-transparent pointer-events-none" />
        {/* Right blur overlay */}
        <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 z-10 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none" />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : allImages.length === 0 ? null : (
          /* Scrolling container */
          <div
            ref={scrollRef}
            onMouseEnter={() => (isPaused.current = true)}
            onMouseLeave={() => (isPaused.current = false)}
            className="flex gap-5 overflow-x-hidden py-4 px-8 carousel-scroll"
            style={{ scrollBehavior: "auto" }}
          >
            {tripled.map((img, i) => (
              <ImageCard key={i} src={img.src} alt={img.alt} />
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
};

export default TemplateCarousel;
