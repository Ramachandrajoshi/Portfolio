import type { Testimonial } from './schema';

/**
 * Approved testimonials only. Never add a testimonial without the author's explicit
 * permission. While this list is empty the page stays out of navigation, the sitemap
 * and search indexes. Validated by testimonialSchema in `pnpm validate:data`.
 */
export const testimonials: Testimonial[] = [];
