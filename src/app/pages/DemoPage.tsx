import { useParams } from "react-router";
import App from "../App";
import { templateMap } from "../templates/templateMap";
import { DEMO_EVENT } from "../demo/demoEvent";

// Landing page-ийн "Load demo" iframe энэ хуудсыг ачаална. DB-ээс уншихгүйгээр
// сонгосон template-ийг demo дататай шууд render хийнэ.
export function DemoPage() {
  const { id } = useParams<{ id: string }>();
  const Template = templateMap[id ?? "11"] ?? App;
  return <Template event={{ ...DEMO_EVENT, template: id }} />;
}
