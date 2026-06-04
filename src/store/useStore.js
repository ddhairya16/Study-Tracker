import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialSubjects = [
  {
    id: 'subj-1',
    name: 'Mathematics',
    color: '#ff4d4d',
    topics: [
      { id: 'top-1-1', name: 'Calculus' },
      { id: 'top-1-2', name: 'Linear Algebra' }
    ]
  },
  {
    id: 'subj-2',
    name: 'Physics',
    color: '#4da6ff',
    topics: [
      { id: 'top-2-1', name: 'Mechanics' },
      { id: 'top-2-2', name: 'Thermodynamics' }
    ]
  }
];

const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const dateString = `${year}-${month}-${day}`;

const initialEvents = [
  {
    id: 'evt-1',
    title: 'Mathematics - Calculus',
    subjectId: 'subj-1',
    topicId: 'top-1-1',
    start: `${dateString}T10:00:00`,
    end: `${dateString}T11:30:00`,
    color: '#ff4d4d',
    notes: 'Review derivatives and limits.',
    completed: false
  },
  {
    id: 'evt-2',
    title: 'Physics - Mechanics',
    subjectId: 'subj-2',
    topicId: 'top-2-1',
    start: `${dateString}T14:00:00`,
    end: `${dateString}T15:00:00`,
    color: '#4da6ff',
    notes: 'Solve kinematic equations.',
    completed: false
  }
];

export const useStore = create(
  persist(
    (set, get) => ({
      // Toasts state
      toasts: [],
      showToast: (message, type = 'info', duration = 3000) => {
        const id = 'toast-' + Date.now() + '-' + Math.random();
        set(state => ({
          toasts: [...state.toasts, { id, message, type, duration }]
        }));
        setTimeout(() => {
          set(state => ({
            toasts: state.toasts.filter(t => t.id !== id)
          }));
        }, duration);
      },
      removeToast: (id) => set(state => ({
        toasts: state.toasts.filter(t => t.id !== id)
      })),

      // --- Curriculum Slice ---
      subjects: initialSubjects,
      addSubject: (subject) => set((state) => ({ subjects: [...state.subjects, subject] })),
      updateSubject: (id, data) => set((state) => ({
        subjects: state.subjects.map(s => s.id === id ? { ...s, ...data } : s)
      })),
      deleteSubject: (id) => set((state) => ({
        subjects: state.subjects.filter(s => s.id !== id),
        // optionally cascade delete events, but we keep it simple
      })),
      addTopic: (subjectId, topic) => set((state) => ({
        subjects: state.subjects.map(s => 
          s.id === subjectId ? { ...s, topics: [...s.topics, topic] } : s
        )
      })),
      updateTopic: (subjectId, topicId, name) => set((state) => ({
        subjects: state.subjects.map(s => 
          s.id === subjectId ? { ...s, topics: s.topics.map(t => t.id === topicId ? { ...t, name } : t) } : s
        )
      })),
      deleteTopic: (subjectId, topicId) => set((state) => ({
        subjects: state.subjects.map(s => 
          s.id === subjectId ? { ...s, topics: s.topics.filter(t => t.id !== topicId) } : s
        )
      })),
      reorderSubjects: (newSubjects) => set({ subjects: newSubjects }),

      // --- Events Slice ---
      events: initialEvents,
      addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
      updateEvent: (id, data) => set((state) => ({
        events: state.events.map(e => e.id === id ? { ...e, ...data } : e)
      })),
      deleteEvent: (id) => set((state) => ({
        events: state.events.filter(e => e.id !== id)
      })),
      toggleEventCompletion: (id) => set((state) => ({
        events: state.events.map(e => e.id === id ? { ...e, completed: !e.completed } : e)
      })),

      // --- Sessions Slice ---
      sessions: [],
      addSession: (session) => set((state) => ({ sessions: [...state.sessions, session] })),

      // --- Timer Session Slice ---
      timerSession: {
        isRunning: false,
        mode: 'Pomodoro', // 'Pomodoro' | 'Countdown' | 'Stopwatch'
        timeLeft: 25 * 60, // seconds
        totalDuration: 25 * 60,
        sessionType: 'focus', // 'focus' | 'shortBreak' | 'longBreak'
        pomodoroCount: 0,
        subjectId: '',
        topicId: '',
        lastTickAt: 0,
        loggedStopwatchMs: 0
      },
      setTimerSession: (data) => set(state => ({
        timerSession: { ...state.timerSession, ...data }
      })),
      tickTimer: () => set(state => {
        const now = Date.now();
        const elapsed = Math.floor((now - state.timerSession.lastTickAt) / 1000);
        const newTimeLeft = Math.max(0, state.timerSession.timeLeft - elapsed);
        return {
          timerSession: {
            ...state.timerSession,
            timeLeft: newTimeLeft,
            lastTickAt: now,
          }
        };
      }),
      tickStopwatch: () => set(state => {
        const now = Date.now();
        const elapsed = now - state.timerSession.lastTickAt;
        return {
          timerSession: {
            ...state.timerSession,
            timeLeft: state.timerSession.timeLeft + elapsed,
            lastTickAt: now,
          }
        };
      }),

      // --- Profile Slice ---
      profile: { name: 'Student', goal: '', hasCompletedOnboarding: false },
      updateProfile: (data) => set((state) => ({ profile: { ...state.profile, ...data } })),

      // --- Settings Slice ---
      settings: { focusDuration: 25, shortBreakDuration: 5, longBreakDuration: 15, themeAccent: '#e8f4ff', theme: 'dark', dailyGoalMinutes: 120 },
      updateSettings: (data) => set((state) => ({ settings: { ...state.settings, ...data } })),

      // --- Recent Items Slice ---
      recentItems: [],
      addRecentItem: (item) => set((state) => {
        const filtered = state.recentItems.filter(i => i.id !== item.id);
        const newItem = { ...item, timestamp: new Date().toISOString() };
        return { recentItems: [newItem, ...filtered].slice(0, 10) };
      }),

      // --- Notes Slice ---
      notes: [],
      noteFolders: [],
      addNoteFolder: (folder) => set((state) => ({ noteFolders: [...state.noteFolders, folder] })),
      updateNoteFolder: (id, data) => set((state) => ({
        noteFolders: state.noteFolders.map(f => f.id === id ? { ...f, ...data } : f)
      })),
      deleteNoteFolder: (id) => set((state) => ({
        noteFolders: state.noteFolders.filter(f => f.id !== id),
        notes: state.notes.filter(n => n.folderId !== id)
      })),
      addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
      updateNote: (id, data) => set((state) => ({
        notes: state.notes.map(n => n.id === id ? { ...n, ...data, updatedAt: new Date().toISOString() } : n)
      })),
      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter(n => n.id !== id)
      })),

      pdfs: [],
      pdfFiles: {},
      activePdfId: null,
      setActivePdfId: (id) => set({ activePdfId: id }),
      addPdf: (pdf) => set((state) => ({ pdfs: [...state.pdfs, { fabricAnnotations: {}, ...pdf }] })),
      updatePdf: (id, data) => set((state) => ({
        pdfs: state.pdfs.map(p => p.id === id ? { ...p, ...data } : p)
      })),
      updatePageAnnotations: (pdfId, pageNumber, fabricJson) => set((state) => ({
        pdfs: state.pdfs.map(p => p.id === pdfId ? {
          ...p,
          fabricAnnotations: {
            ...p.fabricAnnotations,
            [String(pageNumber)]: fabricJson
          }
        } : p)
      })),
      deletePdf: (id) => set((state) => {
        const newFiles = { ...state.pdfFiles };
        delete newFiles[id];
        return {
          pdfs: state.pdfs.filter(p => p.id !== id),
          pdfFiles: newFiles
        };
      }),
      setPdfFile: (id, file) => set((state) => ({
        pdfFiles: { ...state.pdfFiles, [id]: file }
      })),

      // --- Whiteboards Slice ---
      whiteboards: [],
      activeWhiteboardId: null,
      setActiveWhiteboardId: (id) => set({ activeWhiteboardId: id }),
      addWhiteboard: (whiteboard) => set((state) => ({ whiteboards: [...state.whiteboards, whiteboard] })),
      updateWhiteboard: (id, data) => set((state) => ({
        whiteboards: state.whiteboards.map(w => w.id === id ? { ...w, ...data, updatedAt: new Date().toISOString() } : w)
      })),
      deleteWhiteboard: (id) => set((state) => ({
        whiteboards: state.whiteboards.filter(w => w.id !== id),
        activeWhiteboardId: state.activeWhiteboardId === id ? null : state.activeWhiteboardId
      })),

      // --- Global Actions ---
      clearData: () => set(() => ({
        subjects: initialSubjects,
        events: initialEvents,
        sessions: [],
        profile: { name: 'Student', goal: '', hasCompletedOnboarding: false },
        settings: { focusDuration: 25, shortBreakDuration: 5, longBreakDuration: 15, themeAccent: '#e8f4ff', theme: 'dark', dailyGoalMinutes: 120 },
        notes: [],
        noteFolders: [],
        pdfs: [],
        whiteboards: []
      }))
    }),
    {
      name: 'studytracker_v1_store', // Persist to local storage
      partialize: (state) => ({
        subjects: state.subjects,
        events: state.events,
        sessions: state.sessions,
        profile: state.profile,
        settings: state.settings,
        recentItems: state.recentItems,
        notes: state.notes,
        noteFolders: state.noteFolders,
        pdfs: state.pdfs,
        whiteboards: state.whiteboards,
        timerSession: state.timerSession
      })
    }
  )
);
