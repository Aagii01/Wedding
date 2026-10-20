import { Navigate, useParams } from "react-router";
import App from "../App";
import { templateMap } from "../templates/templateMap";
import { DEMO_EVENT } from "../demo/demoEvent";

// Кодын demo хаалттай загварууд — зөвхөн DB мөрөөр үзүүлнэ
// (/i/demo-sonic, /i/demo-spider). /demo/23, /demo/24 → нүүр хуудас руу.
const DEMO_HIDDEN = new Set(["23", "24"]);

// Landing page-ийн "Load demo" iframe энэ хуудсыг ачаална. DB-ээс уншихгүйгээр
// сонгосон template-ийг demo дататай шууд render хийнэ.
export function DemoPage() {
  const { id } = useParams<{ id: string }>();
  if (id && DEMO_HIDDEN.has(id)) return <Navigate to="/" replace />;
  const Template = templateMap[id ?? "11"] ?? App;
  return <Template event={{ ...DEMO_EVENT, template: id }} />;
}
