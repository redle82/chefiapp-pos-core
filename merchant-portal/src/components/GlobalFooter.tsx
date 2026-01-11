import { OSSignature } from '../ui/design-system/sovereign/OSSignature';

export const GlobalFooter = () => {
    return (
        <footer className="w-full py-8 mt-auto border-t border-white/5 bg-black/20 backdrop-blur-sm">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center text-xs text-zinc-500">
                    <div className="flex gap-4 items-center">
                        <span>© {new Date().getFullYear()} ChefIApp™ OS</span>
                    </div>


                    <div className="mt-4 md:mt-0 flex items-center gap-2">
                        <OSSignature size="sm" className="opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all" />
                        <a
                            href="https://goldmonkey.studio"
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-amber-500 transition-colors"
                        >
                            Feito com <span className="text-red-500">❤</span> por GoldMonkey.studio
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
