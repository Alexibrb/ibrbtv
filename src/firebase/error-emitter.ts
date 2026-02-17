import type { FirestorePermissionError } from './errors';

type AppEvents = {
  'permission-error': (error: FirestorePermissionError) => void;
};

class SimpleEventEmitter {
  private listeners: { [key: string]: Function[] } = {};

  on<K extends keyof AppEvents>(event: K, listener: AppEvents[K]) {
    const eventName = event as string;
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(listener);
  }

  off<K extends keyof AppEvents>(event: K, listener: AppEvents[K]) {
    const eventName = event as string;
    if (!this.listeners[eventName]) return;
    this.listeners[eventName] = this.listeners[eventName].filter(
      (l) => l !== listener
    );
  }

  emit<K extends keyof AppEvents>(event: K, ...args: Parameters<AppEvents[K]>) {
    const eventName = event as string;
    if (!this.listeners[eventName]) return;
    this.listeners[eventName].forEach((listener) => {
      try {
        listener(...args);
      } catch (e) {
        console.error(`Error in event listener for ${eventName}`, e);
      }
    });
  }
}

export const errorEmitter = new SimpleEventEmitter();
