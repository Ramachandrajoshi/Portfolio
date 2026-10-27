/**
 * Content-integrity switch. Facts the owner has not yet supplied are modelled as `null`
 * in src/data. Development builds show a visible "to be supplied" marker so gaps are easy
 * to find; production builds omit the field entirely instead of publishing a placeholder.
 *
 * Set NEXT_PUBLIC_SHOW_PLACEHOLDERS=true to preview the markers in a production build.
 */
export const SHOW_PLACEHOLDERS =
  process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_SHOW_PLACEHOLDERS === 'true';
