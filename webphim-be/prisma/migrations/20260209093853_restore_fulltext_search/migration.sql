-- AlterTable
ALTER TABLE "content" ADD COLUMN     "search_vector" tsvector;

-- Create GIN index for fast full-text search
CREATE INDEX idx_content_search ON content USING GIN(search_vector);

-- Create trigger function to auto-update search_vector
CREATE OR REPLACE FUNCTION content_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER content_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, description ON content
  FOR EACH ROW
  EXECUTE FUNCTION content_search_vector_update();

-- Backfill existing rows
UPDATE content SET search_vector =
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B');
