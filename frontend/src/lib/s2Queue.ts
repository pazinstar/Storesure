export type S2QueueEntry = {
    id: string;
    type: 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'RETURN' | 'DAMAGE' | 'REVERSE';
    payload: any;
    attempts: number;
    lastError?: string;
    createdAt: string;
};

const KEY = 's2_failed_queue_v1';

function read(): S2QueueEntry[] {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return [];
        return JSON.parse(raw) as S2QueueEntry[];
    } catch (e) {
        return [];
    }
}

function write(items: S2QueueEntry[]) {
    localStorage.setItem(KEY, JSON.stringify(items));
}

export function listQueue(): S2QueueEntry[] {
    return read();
}

export function enqueue(entry: Omit<S2QueueEntry, 'attempts' | 'createdAt'>) {
    const q = read();
    const now = new Date().toISOString();
    q.push({ ...entry, attempts: 0, createdAt: now });
    write(q);
}

export function removeFromQueue(id: string) {
    const q = read().filter(e => e.id !== id);
    write(q);
}

export function updateEntry(id: string, patch: Partial<S2QueueEntry>) {
    const q = read().map(e => e.id === id ? { ...e, ...patch } : e);
    write(q);
}

export default {
    listQueue,
    enqueue,
    removeFromQueue,
    updateEntry,
};
