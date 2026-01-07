import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-sidebar text-sidebar-foreground mt-auto border-t border-sidebar-border">
      <div className="container-breathe py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Quick Links</h3>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/projects" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">
                  Projects
                </Link>
              </li>
              <li>
                <Link to="/tasks" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">
                  Tasks
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Support</h3>
            <ul className="space-y-1.5 text-xs">
              <li>
                <a href="#" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Contact</h3>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-center gap-2">
                <Mail className="h-3 w-3 flex-shrink-0 text-sidebar-primary" />
                <a href="mailto:support@clienthub.com" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">
                  support@clienthub.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3 w-3 flex-shrink-0 text-sidebar-primary" />
                <a href="mailto:hloniyacho@gmail.com" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">
                  hloniyacho@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-3 w-3 flex-shrink-0 text-sidebar-primary" />
                <a href="tel:+27123456789" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">
                  +27 12 345 6789
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="bg-sidebar-foreground/20 mb-4" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-sidebar-foreground/50">
            © {currentYear} Client Hub Portal. All rights reserved.
          </p>

          {/* Social Media */}
          <div className="flex items-center gap-3">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sidebar-foreground/50 hover:text-sidebar-primary transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sidebar-foreground/50 hover:text-sidebar-primary transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sidebar-foreground/50 hover:text-sidebar-primary transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sidebar-foreground/50 hover:text-sidebar-primary transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
