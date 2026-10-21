// Брэндийн холбоо барих мэдээлэл — нэг газар. LandingPage ба урилга бүрийн
// доорх MadeWithCredit хоёулаа эндээс уншина (хаяг солиход нэг л газар засна).
export const BRAND = {
  name: "Special Day",
  domain: "eurilga.com",
  facebook: "https://www.facebook.com/profile.php?id=61582580015733",
  // m.me — Facebook page-ийн Messenger чат шууд нээгдэнэ (page ID-гаар ажиллана)
  messenger: "https://m.me/61582580015733",
  instagram: "https://www.instagram.com/e_urilga.mn",
  phone: "88328085",
} as const;

/**
 * Messenger чат нээх холбоос. `text` өгвөл мессежийн талбарт урьдчилан
 * бичигдэнэ (утасны Messenger, вэб хоёулаа дэмждэг) — захиалагч аль урилгыг
 * үзээд ирснийг бид шууд мэднэ.
 */
export function messengerUrl(text?: string): string {
  return text ? `${BRAND.messenger}?text=${encodeURIComponent(text)}` : BRAND.messenger;
}

/** Урилгын доорх "Захиалга өгөх" — тухайн урилгын линкийг мессежид оруулна. */
export function orderFromInviteUrl(slug?: string): string {
  return messengerUrl(
    slug
      ? `Сайн байна уу! ${BRAND.domain}/i/${slug} урилга шиг захиалмаар байна.`
      : "Сайн байна уу! Цахим урилга захиалмаар байна.",
  );
}
