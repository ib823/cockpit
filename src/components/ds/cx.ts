/**
 * Class-name joiner for the design system.
 *
 * Deliberately not `cn` from `@/lib/utils`. That helper wraps `clsx` in
 * `twMerge`, whose entire job is resolving conflicts between *Tailwind utility*
 * classes — `text-red-500` beating an earlier `text-blue-500`.
 *
 * These components compose *CSS Module* class names: opaque hashes like
 * `_button_3ede6c`. tailwind-merge has nothing to resolve between them, so it
 * does no work — while pulling roughly 45kB into every route that imports a
 * design-system component. On /login that was the difference between a 28kB
 * route and a 75kB one, for a two-field form.
 *
 * Falsy values are dropped so `cx(styles.button, active && styles.active)`
 * reads naturally.
 */
export function cx(...values: Array<string | false | null | undefined>): string {
  let out = "";
  for (const value of values) {
    if (!value) continue;
    out = out ? `${out} ${value}` : value;
  }
  return out;
}
