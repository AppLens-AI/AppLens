import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-4"
    >
      <div className="container max-w-6xl mx-auto">
        <div className="glass-card px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 hidden sm:block" />
            <span className="font-display font-bold text-xl text-foreground">
              Shotify
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#templates" className="text-muted-foreground hover:text-foreground transition-colors">
              Templates
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Sign In
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
              Start Free
            </Button>
          </div>

          <button 
            className="md:hidden text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden glass-card mt-2 p-4"
          >
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Features
              </a>
              <a href="#templates" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Templates
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Pricing
              </a>
              <hr className="border-border/50" />
              <Button variant="ghost" className="justify-start text-muted-foreground">
                Sign In
              </Button>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
                Start Free
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;