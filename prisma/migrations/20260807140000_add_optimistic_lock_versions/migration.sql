-- Optimistic-lock counters for the two entities users concurrently edit.
--
-- Without these, two clients editing the same task both succeed and the second
-- silently overwrites the first. In a local-first app whose clients queue
-- changes while offline, that is not a rare race — it is the ordinary outcome
-- after two people work on the same plan on a plane.
--
-- DEFAULT 0 rather than NULL so existing rows are immediately usable: a client
-- that has never seen a version sends 0, matches, and writes. NOT NULL keeps
-- the comparison total, with no three-valued logic in the WHERE clause.

ALTER TABLE "GanttPhase" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "GanttTask"  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
