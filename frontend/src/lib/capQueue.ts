function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
}

export type CapQueueEntry = {
  id: string;
  itemId: string;
  payload: any;
  attempts: number;
  createdAt: string;
  lastError?: string;
};

const KEY = 'cap_queue_v1';

function read(): CapQueueEntry[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CapQueueEntry[];
  } catch (e) {
    return [];
  }
}

function write(items: CapQueueEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export default {
  listQueue(): CapQueueEntry[] {
    return read();
  },

  enqueue(entry: Omit<CapQueueEntry, 'id' | 'attempts' | 'createdAt'>) {
    const items = read();
    const e: CapQueueEntry = {
      id: genId(),
      itemId: entry.itemId,
      payload: entry.payload,
      attempts: 0,
      createdAt: new Date().toISOString(),
    };
    items.push(e);
    write(items);
    return e;
  },

  removeFromQueue(id: string) {
    const items = read().filter(i => i.id !== id);
    write(items);
  },

  updateEntry(id: string, patch: Partial<CapQueueEntry>) {
    const items = read().map(i => i.id === id ? { ...i, ...patch } : i);
    write(items);
  },

  clear() {
    write([]);
  }
};
