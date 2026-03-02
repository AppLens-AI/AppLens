import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#templates", label: "Templates" },
    { to: "/docs", label: "Docs" },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
    >
      <div className="container max-w-6xl mx-auto">
        <div
          className={`
            relative flex items-center justify-between px-5 py-3 rounded-2xl
            border transition-all duration-500 ease-out
            ${
              scrolled
                ? "bg-card/80 backdrop-blur-2xl border-border/60 shadow-2xl shadow-black/20"
                : "bg-card/30 backdrop-blur-xl border-white/[0.06] shadow-lg shadow-black/10"
            }
          `}
        >
          {/* Subtle top highlight line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-t-2xl" />

          {/* Logo */}
          <Link to="/" className="relative flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="AppLens"
              className="h-8 w-auto hidden sm:block transition-transform duration-300 group-hover:scale-105"
            />
            <img
              src="/logo.png"
              alt="AppLens"
              className="h-7 w-auto sm:hidden"
            />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Component = link.to ? Link : "a";
              const props = link.to
                ? { to: link.to }
                : { href: link.href };
              return (
                <Component
                  key={link.label}
                  {...(props as any)}
                  className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-xl hover:bg-white/[0.04] group"
                >
                  {link.label}
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary rounded-full group-hover:w-5 transition-all duration-300" />
                </Component>
              );
            })}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-xl hover:bg-white/[0.04]"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="group relative flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-primary-foreground rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/25"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary to-emerald-400 transition-opacity duration-300" />
              <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative">Get Started</span>
              <ArrowRight className="relative w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden relative p-2 rounded-xl text-foreground hover:bg-white/[0.06] transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Menu className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="md:hidden mt-2 p-4 rounded-2xl bg-card/80 backdrop-blur-2xl border border-border/60 shadow-2xl shadow-black/20"
            >
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => {
                  const Component = link.to ? Link : "a";
                  const props = link.to ? { to: link.to } : { href: link.href };
                  return (
                    <Component
                      key={link.label}
                      {...(props as any)}
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-xl transition-colors"
                    >
                      {link.label}
                    </Component>
                  );
                })}
                <div className="my-2 h-px bg-border/50" />
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-xl transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="mt-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-primary-foreground bg-gradient-to-r from-primary to-emerald-400 rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;
