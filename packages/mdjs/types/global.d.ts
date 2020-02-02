declare module 'es-module-lexer' {
  export const init: Promise<void>;
  export function parse(
    code: string,
  ): [{ s: number; e: number; ss: number; se: number }[], string[]];
}
