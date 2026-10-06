"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
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
  return (
    <header className="workspace-header">
      <div className="header-inner">
        <Link className="brand-lockup" href="/" aria-label="Cadence home">
          <span className="brand-mark" aria-hidden="true">
            C
          </span>
          <span>Cadence</span>
        </Link>

        <div className="workspace-switcher">
          <span className="workspace-avatar" aria-hidden="true">
            ES
          </span>
          <span className="workspace-copy">
            <strong>Example Studio</strong>
            <small>Preview workspace</small>
          </span>
          <span className="workspace-chevron" aria-hidden="true">
            ⌄
          </span>
        </div>

        <PrimaryNavigation />

        <div className="header-actions">
          <button
            className="search-preview"
            type="button"
            disabled
            aria-label="Search is unavailable in the synthetic preview"
          >
            <span aria-hidden="true">⌕</span>
            <span>Search unavailable</span>
          </button>
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
        Synthetic preview · No account or client information is connected
        <Link href="/access-denied">Preview access state</Link>
      </div>
    </header>
  );
}
