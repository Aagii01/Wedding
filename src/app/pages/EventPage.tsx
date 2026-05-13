import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { supabase } from "../../lib/supabase";
import { EventData } from "../../types/event";
import App from "../App";
import Template12 from "../templates/Template12";
import Template13 from "../templates/Template13";

const templateMap: Record<string, React.ComponentType<{ event: EventData }>> = {
  "11": App,
  "12": Template12,
  "13": Template13,
};

export function EventPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .single();
      if (data) setEvent(data as EventData);
      else setNotFound(true);
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Ачааллаж байна...
      </div>
    );

  if (notFound)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Хуудас олдсонгүй
      </div>
    );

  const templateKey = event!.template ?? "11";
  const Template = templateMap[templateKey] ?? App;
  return <Template event={event!} />;
}
