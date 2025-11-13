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
      db: {
        getStudents: () => Promise<any[]>;
        getCourses: () => Promise<any[]>;
        getModules: (courseId: number) => Promise<any[]>;
        getLessons: (moduleId: number) => Promise<any[]>;
        getExercises: (lessonId: number) => Promise<any[]>;
        getProgress: (studentId: number) => Promise<any[]>;
        addStudent: (data: any) => Promise<any>;
        updateProgress: (data: any) => Promise<any>;
      };
    };
  }
}
