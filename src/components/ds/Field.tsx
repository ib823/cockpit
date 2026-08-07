/**
 * Design system — field family (compatibility surface).
 *
 * The controls now live in one module each so a page importing `Input` does
 * not also ship Textarea, NumberInput, SearchInput and Select. This file is
 * kept so existing imports keep working; prefer importing from the specific
 * module in any route where bundle size matters.
 */

export { Input } from "./Input";
export type { InputProps } from "./Input";
export { Textarea } from "./Textarea";
export type { TextareaProps } from "./Textarea";
export { NumberInput } from "./NumberInput";
export type { NumberInputProps } from "./NumberInput";
export { SearchInput } from "./SearchInput";
export type { SearchInputProps } from "./SearchInput";
export { Select } from "./Select";
export type { SelectProps } from "./Select";
export type { FieldSize } from "./field-internals";
