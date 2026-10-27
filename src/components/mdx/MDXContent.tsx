import * as runtime from 'react/jsx-runtime';
import type { ComponentType, ReactNode } from 'react';
import { mdxComponents } from './components';

type MDXComponents = Record<string, ComponentType<never>>;

/**
 * Renders Velite's compiled MDX (function-body format) on the server at build time.
 * The compiled code only references the JSX runtime and the components passed in.
 */
function getMDXComponent(code: string) {
  const fn = new Function(code);
  return fn({ ...runtime }).default as ComponentType<{ components?: MDXComponents }>;
}

export function MDXContent({ code, components }: { code: string; components?: MDXComponents }) {
  // The compiled MDX module is a plain, hook-free function: calling it directly renders the
  // content tree without defining a new component type during render.
  const render = getMDXComponent(code) as unknown as (props: { components: MDXComponents }) => ReactNode;
  return render({ components: { ...(mdxComponents as MDXComponents), ...components } });
}
