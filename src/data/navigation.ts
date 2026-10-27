import { testimonials } from './testimonials';

export interface NavItem {
  href: string;
  label: string;
  description: string;
}

export const primaryNav: NavItem[] = [
  { href: '/architecture/', label: 'Architecture', description: 'Case studies, ADRs and system explorers' },
  { href: '/projects/', label: 'Projects', description: 'Selected engineering work' },
  { href: '/articles/', label: 'Articles', description: 'Technical writing' },
  { href: '/skills/', label: 'Skills', description: 'Technical competency map' },
  { href: '/about/', label: 'About', description: 'Profile and career timeline' },
  { href: '/contact/', label: 'Contact', description: 'Get in touch' },
];

export const secondaryNav: NavItem[] = [
  { href: '/services/', label: 'Services', description: 'Architecture and engineering services' },
  { href: '/resume/', label: 'Résumé', description: 'Experience at a glance' },
  { href: '/search/', label: 'Search', description: 'Full-text search' },
  // Testimonials only appear in navigation once approved testimonials exist.
  ...(testimonials.length > 0
    ? [{ href: '/testimonials/', label: 'Testimonials', description: 'What colleagues say' }]
    : []),
];

export const allNav = [{ href: '/', label: 'Home', description: 'The city' }, ...primaryNav, ...secondaryNav];
