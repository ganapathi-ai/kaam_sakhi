'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/checkin', label: 'Check-in' },
  { href: '/workers', label: 'Workers' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-logo">
          <div className="logo-icon">🌸</div>
          <span className="text-gradient">KaamSakhi</span>
        </Link>

        <div className="navbar-nav">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${pathname === link.href ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link href="/checkin" className="btn btn-primary btn-sm">
          + Daily Check-in
        </Link>
      </div>
    </nav>
  );
}
