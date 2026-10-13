-- Загвар тус бүрийн демо урилга (захиалагчид Messenger-ээр явуулдаг).
-- miigaa-urnaa урилгын датаг (зураг, нэр, газар, хөгжим) хуулж, slug ба
-- template-ийг нь сольж 4 мөр үүсгэнэ. Огноо 2027-08-16 — тоологч ажиллана.
--
-- Ажиллуулах: Supabase Dashboard → SQL Editor → буулгаад Run.
-- Дахин ажиллуулахад аюулгүй: байгаа slug-ийг алгасна (not exists).
--
-- Линкүүд:  /i/demo-pearl  /i/demo-azure  /i/demo-ruby  /i/demo-diamond
-- Preview зураг: api/invite.js → OG_IMAGE_BY_SLUG → public/og-demo-*.jpg

insert into events (
  slug, template, type, title, date, time,
  venue_name, venue_address, venue_map_url, maps_photo, main_image,
  person1_name, person1_role, person1_photo, person1_instagram,
  person2_name, person2_role, person2_photo, person2_instagram,
  gallery_photos, gallery2_photos, music_url, poem, schedule, config
)
select
  d.slug, d.template, src.type, src.title, '2027-08-16', src.time,
  src.venue_name, src.venue_address, src.venue_map_url, src.maps_photo, src.main_image,
  src.person1_name, src.person1_role, src.person1_photo, src.person1_instagram,
  src.person2_name, src.person2_role, src.person2_photo, src.person2_instagram,
  src.gallery_photos, src.gallery2_photos, src.music_url, src.poem, src.schedule, src.config
from events src
cross join (values
  ('demo-pearl',   '11'),
  ('demo-azure',   '12'),
  ('demo-ruby',    '13'),
  ('demo-diamond', '14')
) as d(slug, template)
where src.slug = 'miigaa-urnaa'
  and not exists (select 1 from events e where e.slug = d.slug);

-- Шалгах:
-- select slug, template, date, person1_name, person2_name from events where slug like 'demo-%';
