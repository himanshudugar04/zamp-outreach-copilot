"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutList, PenLine } from "lucide-react";

const items = [
  { href: "/", label: "New prospect", icon: PenLine },
  { href: "/dashboard", label: "Runs", icon: LayoutList },
  { href: "/playbooks", label: "Playbooks", icon: BookOpen },
];

export function Rail() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 flex h-screen w-[68px] shrink-0 flex-col items-center gap-1 bg-ink py-4 text-white md:w-[208px] md:items-stretch md:px-3">
      <Link href="/" className="mb-6 flex items-center gap-2 px-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-[13px] font-semibold tracking-tight text-white">OD</span>
        <span className="hidden text-[13px] font-semibold leading-tight md:block">
          Outreach Desk
          <span className="block text-2xs font-normal text-white/50">for Zamp GTM</span>
        </span>
      </Link>
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? path === "/" : path.startsWith(href) || (href === "/dashboard" && path.startsWith("/runs"));
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-md px-2 py-2 text-[13px] ${active ? "bg-white/10 font-medium text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
            title={label}
          >
            <Icon size={17} strokeWidth={1.75} />
            <span className="hidden md:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
