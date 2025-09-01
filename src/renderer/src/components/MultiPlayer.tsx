import { useEffect, useMemo, useState } from 'react';

type MediaItem = { id: string; title: string; url: string };
type Slot = { id: number; media?: MediaItem };

const mockLibrary: MediaItem[] = [
  { id: '1', title: 'Sample 1', url: 'file:///path/to/sample1.mp4' },
  { id: '2', title: 'Sample 2', url: 'file:///path/to/sample2.mp4' },
  // Replace with real data
];

export default function MultiPlayer() {
  const [slots, setSlots] = useState<Slot[]>(() => Array.from({ length: 4 }, (_, i) => ({ id: i })));
  const [active, setActive] = useState<number>(0);
  const [q, setQ] = useState('');
  const [quickFor, setQuickFor] = useState<number | null>(null);

  // If you wired search to main via IPC, replace with await window.api.searchLibrary(q)
  const results = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return mockLibrary;
    return mockLibrary.filter((m) => m.title.toLowerCase().includes(qq));
  }, [q]);

  // If a videoId is passed when opening the window, slot 0 loads it
  useEffect(() => {
    const off = window.api.onMultiInitial((videoId) => {
      const found = mockLibrary.find((m) => m.id === videoId);
      if (found) setSlots((prev) => prev.map((s, i) => (i === 0 ? { ...s, media: found } : s)));
    });
    return off;
  }, []);

  function setSlotMedia(slotIndex: number, media: MediaItem) {
    setSlots((prev) => prev.map((s, i) => (i === slotIndex ? { ...s, media } : s)));
  }

  return (
    <div className="h-screen w-screen text-gray-100 bg-neutral-900 grid grid-cols-[360px_1fr]">
      {/* Left: Search */}
      <aside className="border-r border-neutral-800 p-4 space-y-3">
        <div className="text-xl font-semibold">Library</div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search videos…"
          className="w-full rounded-lg bg-neutral-800 px-3 py-2 outline-none"
        />
        <div className="text-sm text-neutral-400">Active slot: {active + 1}</div>

        <div className="mt-2 space-y-2 overflow-auto max-h-[calc(100vh-170px)] pr-1">
          {results.map((m) => (
            <div key={m.id} className="rounded-lg bg-neutral-800 p-3 hover:bg-neutral-700 transition">
              <div className="font-medium">{m.title}</div>
              <div className="text-xs text-neutral-400">{m.url}</div>
              <div className="mt-2 flex gap-2">
                <button
                  className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500"
                  onClick={() => setSlotMedia(active, m)}
                >
                  Add to Active
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Right: Player Grid */}
      <main className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xl font-semibold">Multi-Player</div>
          <div className="text-sm text-neutral-400">Click a tile to select; each has its own controls.</div>
        </div>

        <div className="grid grid-cols-2 grid-rows-2 gap-4">
          {slots.map((slot, i) => (
            <div
              key={slot.id}
              className={[
                'relative rounded-xl overflow-hidden bg-neutral-800 border',
                active === i ? 'border-blue-500' : 'border-neutral-800',
              ].join(' ')}
              onClick={() => setActive(i)}
            >
              {!slot.media ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="text-neutral-400">No media</div>
                  <button
                    className="px-3 py-1 rounded-md bg-neutral-700 hover:bg-neutral-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickFor(i);
                    }}
                  >
                    Add to Player
                  </button>
                </div>
              ) : (
                <video
                  src={slot.media.url}
                  className="w-full h-full object-contain bg-black"
                  controls
                  preload="metadata"
                />
              )}
              {/* Slot header */}
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-xs">
                <span className="px-2 py-1 rounded bg-black/50">
                  Slot {i + 1} {slot.media ? `• ${slot.media.title}` : ''}
                </span>
                {slot.media && (
                  <button
                    className="px-2 py-1 rounded bg-black/50 hover:bg-black/60"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, media: undefined } : s)));
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Quick Search Modal */}
      {quickFor !== null && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center"
          onClick={() => setQuickFor(null)}
        >
          <div
            className="w-[680px] max-w-[90vw] rounded-2xl bg-neutral-900 border border-neutral-800 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold mb-3">Add to Player {quickFor + 1}</div>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search videos…"
              className="w-full rounded-lg bg-neutral-800 px-3 py-2 outline-none"
            />
            <div className="mt-3 max-h-[50vh] overflow-auto space-y-2">
              {results.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg bg-neutral-800 p-3">
                  <div>
                    <div className="font-medium">{m.title}</div>
                    <div className="text-xs text-neutral-400">{m.url}</div>
                  </div>
                  <button
                    className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500"
                    onClick={() => {
                      setSlotMedia(quickFor, m);
                      setQuickFor(null);
                    }}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <button className="px-3 py-1 rounded-md bg-neutral-700 hover:bg-neutral-600" onClick={() => setQuickFor(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

