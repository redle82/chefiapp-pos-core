// @ts-nocheck
import { Link } from "react-router-dom";
import { MadeWithLoveFooter } from "./MadeWithLoveFooter";

export const GlobalFooter = () => {
  return (
    <footer className="w-full py-8 mt-auto border-t border-white/5 bg-black/20 backdrop-blur-sm">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-zinc-500">
          <div className="flex flex-wrap gap-4 items-center">
            <span>© {new Date().getFullYear()} ChefIApp™ OS</span>
            <span className="hidden md:inline text-white/10">•</span>
            <Link
              to="/legal/terms"
              className="hover:text-white transition-colors"
            >
              Termos
            </Link>
            <Link
              to="/legal/privacy"
              className="hover:text-white transition-colors"
            >
              Privacidade
            </Link>
            <Link
              to="/legal/dpa"
              className="hover:text-white transition-colors"
            >
              DPA
            </Link>
          </div>

          <div className="mt-4 md:mt-0">
            <MadeWithLoveFooter variant="inline" />
          </div>
        </div>
      </div>
    </footer>
  );
};
