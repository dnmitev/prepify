"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/exam", label: "Practice" },
  { href: "/history", label: "History" },
  { href: "/admin/jobs", label: "Admin jobs" },
  { href: "/experimental/webllm", label: "Experimental" },
];

function linkIsCurrent(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="app-nav" aria-label="Primary" data-testid="app-nav">
      <ul className="app-nav-list">
        {LINKS.map(({ href, label }) => {
          const current = linkIsCurrent(pathname, href);
          return (
            <li key={href}>
              <Link href={href} aria-current={current ? "page" : undefined}>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
