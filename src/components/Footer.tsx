import { Sparkles } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-16 px-4 border-t border-border/50">
      <div className="container max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">
                ScreenCraft
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              Create stunning app screenshots in seconds. The ultimate tool for developers and designers.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Features</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Templates</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Pricing</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Changelog</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">About</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Blog</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Careers</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Privacy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Terms</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 ScreenCraft. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              Twitter
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              GitHub
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              Discord
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;