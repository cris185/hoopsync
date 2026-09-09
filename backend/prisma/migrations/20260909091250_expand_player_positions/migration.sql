-- AlterEnum
BEGIN;
CREATE TYPE "PlayerPosition_new" AS ENUM ('POINT_GUARD', 'SHOOTING_GUARD', 'SMALL_FORWARD', 'POWER_FORWARD', 'CENTER');
ALTER TABLE "players" ALTER COLUMN "position" TYPE "PlayerPosition_new" USING ("position"::text::"PlayerPosition_new");
ALTER TYPE "PlayerPosition" RENAME TO "PlayerPosition_old";
ALTER TYPE "PlayerPosition_new" RENAME TO "PlayerPosition";
DROP TYPE "public"."PlayerPosition_old";
COMMIT;

