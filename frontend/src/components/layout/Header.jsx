import { ClipboardPlus, Mic } from "lucide-react";

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-clinic-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <a href="#home" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-clinic-teal text-white">
            <ClipboardPlus className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold sm:text-base">MedAssist AI</span>
        </a>
        <nav className="hidden items-center gap-6 text-sm font-medium text-clinic-muted sm:flex">
          <a className="hover:text-clinic-teal" href="#home">
            Home
          </a>
          <a className="hover:text-clinic-teal" href="#features">
            Features
          </a>
          <a className="hover:text-clinic-teal" href="#upload">
            Upload Audio
          </a>
          <a className="hover:text-clinic-coral" href="#record">
            <Mic className="mr-1 inline h-3.5 w-3.5" />
            Record Live
          </a>
        </nav>
      </div>
    </header>
  );
}

export default Header;
