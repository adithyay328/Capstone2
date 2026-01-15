import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FiAlignJustify } from "react-icons/fi";
import { IoIosHelpCircleOutline } from "react-icons/io";
import { LuGrid2X2Plus } from "react-icons/lu";
import { IoLibrary, IoPersonCircle } from "react-icons/io5";
import { PiProjectorScreenDuotone } from "react-icons/pi";
import { MdOutlineSettings } from "react-icons/md";
import { ImStack } from "react-icons/im";


type SidebarProps = {
  initialOpen?: boolean;
  onNewProject?: () => void;
  onOpenProjects?: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ 
    initialOpen = false,
    onNewProject,
    onOpenProjects,
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const asideRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || !asideRef.current) return;
      if (!asideRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const primaryItems = [
    {
      id: "new-project",
      label: "New Project",
      icon: LuGrid2X2Plus,
      onClick: onNewProject,
      href: "/new-project",
    },
    {
      id: "projects",
      label: "My Projects",
      icon: IoLibrary,
      onClick: onOpenProjects,
      href: "/projects",
    },
    { id: "labs", label: "Labs", icon: PiProjectorScreenDuotone, href: "/labs" },
  ];

  const secondaryItems = [
    { id: "profile", label: "Profile", icon: IoPersonCircle, href: "/profile" },
    { id: "settings", label: "Settings", icon: MdOutlineSettings, href: "/settings" },
    { id: "help-feedback", label: "Help & Feedback", icon: IoIosHelpCircleOutline, href: "/help" },
    { id: "riscv-docs", label: "RISC-V Documentation", icon: ImStack, href: "/docs" },
  ];


  return (
    <aside
      ref={asideRef}
      className={`fixed inset-y-0 h-full left-0 z-40 flex flex-col border-r border-orange-300 bg-[rgb(34,33,34)] text-slate-100 transition-[width] duration-300 ease-out ${
        isOpen ? "w-64" : "w-16"
      }`}
      aria-label="Sidebar"
      onClick={(event) => {
        const target = event.target as HTMLElement | null;
        if (target?.closest("button, a")) return;
        setIsOpen((prev) => !prev);
      }}
    >
      {/* menu toggle button*/}
      <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex gap-3 px-4 py-4 border-b border-slate-800 hover:bg-[rgb(59,56,59)] transition-colors"
            aria-expanded={isOpen}
      >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-950 text-white text-lg font-bold">
                <FiAlignJustify />
            </div>
            {isOpen && (
            <div className="flex flex-col text-left">
                <span className="text-sm font-semibold tracking-tight">
                RISC-V IDE
                </span>
                <span className="text-[11px] text-slate-400">
                Arizona State University
                </span>
            </div>
            )}
      </button>

      {/* Main nav */}
      <nav className="flex-1  px-2 py-3 space-y-4">
        {/* Primary section */}
        <div>
          {isOpen && (
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Workspaces
            </p>
          )}
          <div className="space-y-1">
            {primaryItems.map((item) => (
              <SidebarButton
                key={item.id}
                label={item.label}
                icon={item.icon}
                showTooltipOnCollapse
                isOpen={isOpen}
                href={item.href}
                onClick={() => {
                  if (!item.href) {
                    item.onClick?.();
                  }
                  setIsOpen(false);
                }}
              />
            ))}
          </div>
        </div>

        {/* Secondary section (only when open) */}
        {isOpen && (
          <div>
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              General
            </p>
            <div className="space-y-1">
              {secondaryItems.map((item) => (
                <SidebarButton
                  key={item.id}
                  label={item.label}
                  icon={item.icon}
                  isOpen={isOpen}
                  href={item.href}
                  onClick={() => {
                    if (!item.href) {
                      item.onClick?.();
                    }
                    setIsOpen(false);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer / version / whatever (optional) */}
      <div className="px-3 py-3 border-t border-slate-800 text-[11px] text-slate-500">
        {isOpen ? (
          <span>Capstone Project Est. 2025</span>
        ) : (
          <span className="block text-center">v0.1</span>
        )}
      </div>
    </aside>
  );
};

type SidebarButtonProps = {
  label: string;
  isOpen: boolean;
  icon: React.ComponentType<any>;
  showTooltipOnCollapse?: boolean; //for the buttons that are always shown when collapsed
  onClick?: () => void;
  href?: string;
};

const SidebarButton: React.FC<SidebarButtonProps> = ({
  label,
  isOpen,
  icon: Icon,
  showTooltipOnCollapse,
  onClick,
  href,
}) => {
  console.log({ label, isOpen, showTooltipOnCollapse });

  const content = (
    <>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-orange-300 text-[11px] font-semibold tracking-wide text-slate-200">
        <Icon className="h-4 w-4 text-white" />
      </span>
      {isOpen && <span className="truncate">{label}</span>}
    </>
  );

  return (
    <div className="relative group">
      {href ? (
        <Link
          href={href}
          onClick={onClick}
          className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-slate-100 hover:bg-[rgb(59,56,59)] transition-colors ${
            isOpen ? "justify-start" : "justify-center"
          }`}
        >
          {content}
        </Link>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-slate-100 hover:bg-[rgb(59,56,59)] transition-colors ${
            isOpen ? "justify-start" : "justify-center"
          }`}
        >
          {content}
        </button>
      )}

        {!isOpen && showTooltipOnCollapse && (
        <div
          className="
            pointer-events-none
            absolute left-full top-1/2 -translate-y-1/2 ml-4
            hidden group-hover:flex
            items-center
            rounded-lg bg-black px-3 py-1
            text-xs text-slate-100 shadow-lg whitespace-nowrap
            z-50
          "
        >
          {label}

        </div>
      )}
    </div>

  );
};

export default Sidebar;
