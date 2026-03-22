import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { MarketSelector } from "./MarketSelector";

const NAV_LINKS = [
  { label: "Features", to: "/features" },
  { label: "Preços", to: "/pricing" },
  { label: "Comparar", to: "/compare" },
  { label: "Blog", to: "/blog" },
] as const;

export function MarketingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#0b0b0f]/80 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2 text-white font-semibold text-sm">
          <span className="text-amber-500">◆</span>
          ChefiApp™ OS
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <MarketSelector />
          <Link
            to="/auth/email"
            className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-colors"
          >
            Começar grátis
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-white/60 hover:text-white"
            aria-label="Menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0b0b0f]/95 backdrop-blur-md px-4 py-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="block text-sm text-white/70 hover:text-white py-2"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-2 py-2">
            <MarketSelector />
            <span className="text-xs text-white/40">Change market</span>
          </div>
          <Link
            to="/auth/email"
            onClick={() => setMenuOpen(false)}
            className="block text-center px-4 py-2 text-sm font-semibold rounded-lg bg-amber-500 text-black"
          >
            Começar grátis
          </Link>
        </div>
      )}
    </header>
  );
}
