/**
 * venue_map_url дээр http(s):// угтвар байхгүй бол ("google.com/maps?q=...")
 * браузер харьцангуй зам гэж ойлгож сайтын хаяг дээр наана — товч дарахад
 * Google Maps биш, урилгын үндсэн вэб рүү үсэрдэг. Угтваргүй бол https://
 * нэмж бүтэн болгоно.
 */
export function normalizeUrl(u?: string) {
  if (!u) return u;
  const s = u.trim();
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}
