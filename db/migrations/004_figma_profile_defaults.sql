UPDATE psychologists
SET categories =
      '["personal"]'::jsonb
      || CASE
        WHEN focus ILIKE '%хос%'
          OR focus ILIKE '%харилца%'
          OR focus ILIKE '%гэрлэлт%'
          OR focus ILIKE '%дотно%'
        THEN '["couples"]'::jsonb
        ELSE '[]'::jsonb
      END
      || CASE
        WHEN focus ILIKE '%гэр бүл%'
          OR focus ILIKE '%хүүхэд%'
          OR focus ILIKE '%эцэг эх%'
        THEN '["family"]'::jsonb
        ELSE '[]'::jsonb
      END
      || CASE
        WHEN focus ILIKE '%өсвөр%'
        THEN '["teen"]'::jsonb
        ELSE '[]'::jsonb
      END
      || CASE
        WHEN focus ILIKE '%ажил мэргэжил%'
          OR focus ILIKE '%гүйцэтгэлийн дасгалжуулалт%'
        THEN '["other"]'::jsonb
        ELSE '[]'::jsonb
      END,
    session_formats = '["online", "inperson"]'::jsonb
WHERE status = 'approved'
  AND (categories = '[]'::jsonb OR session_formats = '[]'::jsonb);
