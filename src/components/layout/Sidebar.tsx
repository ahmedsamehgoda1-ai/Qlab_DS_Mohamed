import { LayoutDashboard, LineChart, ShieldAlert, Info, X, ChevronRight, LucideIcon } from "lucide-react";
import { NavId } from "@/types";

interface NavItem {
  id: NavId;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "analysis", label: "Analysis", icon: LineChart },
  { id: "defects", label: "Defects", icon: ShieldAlert },
  { id: "info", label: "Documentation", icon: Info },
];

interface SidebarProps {
  active: NavId;
  setActive: (id: NavId) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function Sidebar({ active, setActive, open, setOpen }: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`fixed md:static z-40 h-full md:h-auto w-72 shrink-0 text-white flex flex-col overflow-hidden
        bg-[radial-gradient(120%_140%_at_0%_0%,#163B66_0%,#0A1626_45%,#060C16_100%)]
        transition-transform duration-300 ease-out
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div
          className="pointer-events-none absolute -right-10 top-0 h-full w-40 opacity-20"
          style={{
            background:
              "linear-gradient(115deg, transparent 40%, #1C69D4 42%, #1C69D4 46%, transparent 48%, #16B8A6 50%, #16B8A6 53%, transparent 55%)",
          }}
        />

        <div className="relative flex items-center gap-3 px-6 h-20 border-b border-white/10">
          <img src="/bmw-logo.png" alt="BMW" className="h-8 w-8 shrink-0" />
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight">BMW Group</div>
            <div className="text-[11px] text-[#7C93AC] tracking-widest uppercase">
              QLab · Debrecen
            </div>
          </div>
          <button
            className="ml-auto md:hidden text-[#7C93AC] hover:text-white"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="relative flex-1 px-3 py-6 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-[0.15em] text-[#4A5A6E] uppercase">
            Total Vehicle Quality
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActive(item.id);
                  setOpen(false);
                }}
                className={`w-full group relative flex items-center gap-3 px-3 py-3 rounded-lg text-[14px] font-medium
                transition-all duration-150
                ${
                  isActive
                    ? "bg-gradient-to-r from-bmw-blue/20 to-transparent text-white shadow-[inset_0_0_0_1px_rgba(79,168,232,0.25)]"
                    : "text-[#9FB0C3] hover:bg-white/5 hover:text-white"
                }`}
              >
                <span
                  className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full transition-all duration-150
                  ${isActive ? "bg-gradient-to-b from-bmw-sky to-bmw-teal" : "bg-transparent"}`}
                />
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.3 : 1.8}
                  className={isActive ? "text-bmw-sky" : ""}
                />
                <span>{item.label}</span>
                {isActive && <ChevronRight size={15} className="ml-auto text-bmw-sky" />}
              </button>
            );
          })}
        </nav>

        <div className="relative px-6 py-5 border-t border-white/10">
          <div className="text-[11px] text-[#4A5A6E]">iX0 Production Line</div>
        </div>
      </aside>
    </>
  );
}
