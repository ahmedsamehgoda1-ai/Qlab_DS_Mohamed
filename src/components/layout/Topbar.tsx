import { Menu } from "lucide-react";
import { StatusChip } from "./StatusChip";

interface TopbarProps {
  title: string;
  subtitle: string;
  setOpen: (open: boolean) => void;
}

export function Topbar({ title, subtitle, setOpen }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-hairline">
      <div className="flex items-center gap-4 px-5 md:px-8 h-20">
        <button
          className="md:hidden text-ink"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <div>
          <h1 className="text-[20px] md:text-[22px] font-semibold tracking-tight text-ink">
            {title}
          </h1>
          <p className="text-[13px] text-slate mt-0.5">{subtitle}</p>
        </div>
        <div className="ml-auto hidden sm:block">
          <StatusChip />
        </div>
      </div>
    </header>
  );
}
