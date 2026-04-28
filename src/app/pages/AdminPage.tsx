import { useEffect, useState } from "react";
import { Link } from "react-router";
import { supabase } from "../../lib/supabase";
import { EventData } from "../../types/event";

type Rsvp = {
  id: string;
  name: string;
  email: string;
  event: string;
  guests: number;
  created_at: string;
};

type Wish = {
  id: string;
  nickname: string;
  name: string;
  message: string;
  created_at: string;
};

type EventWithStats = EventData & {
  rsvps: Rsvp[];
  wishes: Wish[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("mn-MN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminPage() {
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<"rsvp" | "wishes">("rsvp");

  useEffect(() => {
    async function load() {
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (!eventsData) return setLoading(false);

      const enriched = await Promise.all(
        eventsData.map(async (ev) => {
          const [{ data: rsvps }, { data: wishes }] = await Promise.all([
            supabase.from("rsvp").select("*").eq("event_id", ev.id).order("created_at", { ascending: false }),
            supabase.from("wishes").select("*").eq("event_id", ev.id).order("created_at", { ascending: false }),
          ]);
          return { ...ev, rsvps: rsvps ?? [], wishes: wishes ?? [] };
        })
      );

      setEvents(enriched as EventWithStats[]);
      if (enriched.length > 0) setSelected(enriched[0].id);
      setLoading(false);
    }
    load();
  }, []);

  const activeEvent = events.find((e) => e.id === selected);
  const totalGuests = activeEvent?.rsvps.reduce((s, r) => s + r.guests, 0) ?? 0;

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Ачааллаж байна...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Admin</h1>
        <Link
          to="/create"
          className="bg-gray-800 text-white text-xs font-medium px-5 py-2 rounded-full hover:bg-gray-700 transition-colors"
        >
          + Шинэ урилга
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
        {/* Events sidebar */}
        <div className="w-full md:w-72 flex-shrink-0 space-y-2">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3 px-1">
            Урилгууд ({events.length})
          </p>
          {events.length === 0 && (
            <p className="text-sm text-gray-400 px-1">Урилга байхгүй байна</p>
          )}
          {events.map((ev) => {
            const displayName = ev.person2_name
              ? `${ev.person1_name} & ${ev.person2_name}`
              : ev.person1_name;
            return (
              <button
                key={ev.id}
                onClick={() => setSelected(ev.id)}
                className={`w-full text-left px-4 py-3 rounded-2xl transition-colors ${
                  selected === ev.id
                    ? "bg-gray-800 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                <p className="font-medium text-sm truncate">{displayName}</p>
                <p className={`text-xs mt-0.5 ${selected === ev.id ? "text-gray-300" : "text-gray-400"}`}>
                  /i/{ev.slug}
                </p>
                <div className={`flex gap-3 mt-2 text-xs ${selected === ev.id ? "text-gray-300" : "text-gray-400"}`}>
                  <span>{ev.rsvps.length} RSVP</span>
                  <span>{ev.wishes.length} Wishes</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        {activeEvent && (
          <div className="flex-1 space-y-4">
            {/* Event info */}
            <div className="bg-white rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {activeEvent.person2_name
                      ? `${activeEvent.person1_name} & ${activeEvent.person2_name}`
                      : activeEvent.person1_name}
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {activeEvent.date} · {activeEvent.time} · {activeEvent.venue_name}
                  </p>
                </div>
                <a
                  href={`/i/${activeEvent.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2"
                >
                  Харах ↗
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "RSVP", value: activeEvent.rsvps.length },
                  { label: "Нийт зочин", value: totalGuests },
                  { label: "Wishes", value: activeEvent.wishes.length },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl overflow-hidden">
              <div className="flex border-b border-gray-100">
                {(["rsvp", "wishes"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                      tab === t
                        ? "text-gray-800 border-b-2 border-gray-800"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {t === "rsvp" ? `RSVP (${activeEvent.rsvps.length})` : `Wishes (${activeEvent.wishes.length})`}
                  </button>
                ))}
              </div>

              <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
                {tab === "rsvp" && (
                  <>
                    {activeEvent.rsvps.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-10">RSVP байхгүй байна</p>
                    )}
                    {activeEvent.rsvps.map((r) => (
                      <div key={r.id} className="px-5 py-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{r.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{r.email}</p>
                          <p className="text-xs text-gray-400">
                            {r.event === "ceremony"
                              ? "Ёслол"
                              : r.event === "reception"
                              ? "Хурим"
                              : "Хоёул"}{" "}
                            · {r.guests} хүн
                          </p>
                        </div>
                        <p className="text-xs text-gray-300">{formatDate(r.created_at)}</p>
                      </div>
                    ))}
                  </>
                )}

                {tab === "wishes" && (
                  <>
                    {activeEvent.wishes.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-10">Wishes байхгүй байна</p>
                    )}
                    {activeEvent.wishes.map((w) => (
                      <div key={w.id} className="px-5 py-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-800">
                            {w.nickname}
                            {w.name && (
                              <span className="text-gray-400 font-normal ml-1">({w.name})</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-300">{formatDate(w.created_at)}</p>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed">{w.message}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
