// src/types/global.d.ts
export {};

declare global {
  interface Window {
    edunow?: {
      chatStream: (
        messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
        id?: string
      ) => {
        onChunk: (cb: (delta: string) => void) => () => void;
        onDone: (cb: (payload: { ok?: boolean; error?: string }) => void) => void;
        cancel: () => void;
      };
    };
  }
}
