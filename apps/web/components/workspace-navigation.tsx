"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { BrandMark } from "@/components/brand-mark";
import { useWorkspace } from "@/components/workspace-context";
import {
  mobileNavigation,
  primaryNavigation,
} from "@/components/navigation-items";

function isCurrentPath(pathname: string, href: string): boolean {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function PrimaryNavigation() {
  const pathname = usePathname();

  return (
    <nav className="primary-navigation" aria-label="Workspace">
      {primaryNavigation.map((item) => {
        const isCurrent = isCurrentPath(pathname, item.href);
        return (
          <Link
            key={item.href}
            className={`nav-link${isCurrent ? " is-current" : ""}`}
            href={item.href}
            aria-current={isCurrent ? "page" : undefined}
          >
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();
  const isMoreSection = [
    "/access-denied",
    "/learn",
    "/library",
    "/settings",
  ].some((href) => isCurrentPath(pathname, href));

  return (
    <nav className="mobile-navigation" aria-label="Primary">
      {mobileNavigation.map((item) => {
        const isCurrent =
          isCurrentPath(pathname, item.href) ||
          (item.href === "/settings" && isMoreSection);
        return (
          <Link
            key={item.href}
            className={`mobile-nav-link${isCurrent ? " is-current" : ""}`}
            href={item.href}
            aria-current={isCurrent ? "page" : undefined}
          >
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function WorkspaceHeader() {
  const workspace = useWorkspace();
  return (
    <header className="workspace-header">
      <div className="header-inner">
        <Link className="brand-lockup" href="/" aria-label="Cadence home">
          <BrandMark className="brand-mark" />
          <span>Cadence</span>
        </Link>

        <div className="workspace-switcher">
          <span className="workspace-avatar" aria-hidden="true">
            {workspace.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="workspace-copy">
            <strong>{workspace.name}</strong>
            <small>Closed pilot</small>
          </span>
        </div>

        <PrimaryNavigation />

        <div className="header-actions">
          <Link className="search-preview" href="/library">
            <span aria-hidden="true">⌕</span>
            <span>Search library</span>
          </Link>
          <Link className="button-primary header-create" href="/create">
            <span aria-hidden="true">+</span> Create new
          </Link>
          <UserButton
            userProfileUrl="/account/security"
            userProfileMode="navigation"
            signInUrl="/sign-in"
            appearance={{ elements: { avatarBox: "profile-avatar" } }}
          />
        </div>
      </div>
      <div className="preview-strip" role="note">
        <span className="status-dot" aria-hidden="true" />
        Closed pilot · Use synthetic content until privacy readiness is complete
        <Link href="/access-denied">Preview access state</Link>
      </div>
    </header>
  );
}
