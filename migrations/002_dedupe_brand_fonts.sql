-- Existing installs were seeded (by 001_init.sql) with the eight web-safe font
-- stacks stored as *brand* fonts. The builder merges brand fonts with the
-- built-in web-safe list, so every family showed up twice in the Design screen
-- font dropdown. Reset that exact seeded payload back to an empty list; installs
-- whose brand fonts have since been edited keep whatever they contain.
UPDATE settings
SET `value` = '[]'
WHERE `key` = 'brand_fonts'
  AND REPLACE(REPLACE(REPLACE(`value`, ' ', ''), '\n', ''), '\r', '') = '[{"name":"Arial","stack":"Arial,Helvetica,sans-serif"},{"name":"Helvetica","stack":"Helvetica,Arial,sans-serif"},{"name":"Georgia","stack":"Georgia,serif"},{"name":"TimesNewRoman","stack":"''TimesNewRoman'',Times,serif"},{"name":"TrebuchetMS","stack":"''TrebuchetMS'',Tahoma,sans-serif"},{"name":"Verdana","stack":"Verdana,Geneva,sans-serif"},{"name":"Tahoma","stack":"Tahoma,Verdana,sans-serif"},{"name":"CourierNew","stack":"''CourierNew'',Courier,monospace"}]';
