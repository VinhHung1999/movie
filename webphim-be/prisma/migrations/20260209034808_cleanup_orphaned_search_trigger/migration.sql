-- Drop orphaned trigger and function from Sprint 6 migration drift
-- The trigger references a non-existent search_vector column
DROP TRIGGER IF EXISTS content_search_vector_trigger ON content;
DROP FUNCTION IF EXISTS content_search_vector_update();
