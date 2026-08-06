-- Seeds the tables with what is currently hardcoded in index.html, so the
-- admin panel opens onto the live content instead of an empty list.
--
-- Run this AFTER uploading the media, since the paths below must match the
-- object names in the `demos` and `covers` buckets. Upload the six mp3s from
-- assets/audio/ and the three portrait covers from assets/img/covers/ using
-- their existing filenames and these paths line up as written.

insert into public.demos (genre, tags, source_title, source_author, audio_path, duration_seconds, sort_order) values
  ('RomCom',             '1st POV · Dual · Banter · Explicit', 'Make the Play', 'Hailey Rodger', 'romcom.mp3',             71,  0),
  ('Paranormal Romance', '3rd POV · MF · Intense',              null,            null,            'paranormal-romance.mp3', 110, 1),
  ('Romance',            'Kiwi Accent · 1st POV · Female',      'Seal the Deal', 'Hailey Rodger', 'romance-kiwi.mp3',       60,  2),
  ('Thriller',           '3rd POV · Female',                    null,            null,            'thriller.mp3',           70,  3),
  ('Fantasy',            '1st POV · MMC Narration',             'Crown of Deceit', null,          'fantasy-mmc.mp3',        90,  4),
  ('Fantasy',            '1st POV · FMC Narration',             null,            null,            'fantasy-fmc.mp3',        60,  5)
on conflict do nothing;

insert into public.releases (title, author, meta, badge, badge_variant, cover_path, sort_order) values
  ('Over the Line',  'Hailey Rodger', 'Colorado Storm, Book 4', 'Coming Soon',   'soon',       'over-the-line.jpg',  0),
  ('House of Byrne', 'H. B. Elliott', 'Dark Romance',           'Coming Soon',   'soon',       'house-of-byrne.jpg', 1),
  ('Moniker',        'Wrenna King',   'A Dark Voices Novel',    'In Production', 'production', 'moniker.jpg',        2)
on conflict do nothing;
