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
        updateChatTitle(editingChatId: number, arg1: string): unknown;
        getStudents: () => Promise<any[]>;
        getStudent: (studentId: number) => Promise<any>;
        getCourses: () => Promise<any[]>;
        getModules: (courseId: number) => Promise<any[]>;
        getLessons: (moduleId: number) => Promise<any[]>;
        getExercises: (lessonId: number) => Promise<any[]>;
        getProgress: (studentId: number) => Promise<any[]>;
        getCoursesInProgress: (studentId: number) => Promise<any[]>;
        addStudent: (data: any) => Promise<any>;
        updateProgress: (data: any) => Promise<any>;
        createChat: (studentId: number, title: string) => Promise<number>;
        getChatsForStudent: (studentId: number) => Promise<any[]>;
        deleteChat: (chatId: number) => Promise<void>;
        addMessage: (chatId: number, role: string, content: string) => Promise<void>;
        getMessagesForChat: (chatId: number) => Promise<any[]>;
        checkAndUpdateLives: (studentId: number) => Promise<boolean>;
        getStudentStats: (studentId: number) => Promise<any>;
        getStudentAchievements: (studentId: number) => Promise<any[]>;
      };
    };
  }
}
