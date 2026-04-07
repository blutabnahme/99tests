-- Migration 010: Backfill missing display_ids on tt_order

UPDATE tt_order o
SET display_id = r.display_id
FROM tt_recommendation r
WHERE o.recommendation_id = r.id
  AND (o.display_id IS NULL OR o.display_id = '');
