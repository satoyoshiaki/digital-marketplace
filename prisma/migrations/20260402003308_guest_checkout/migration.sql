-- AlterTable
ALTER TABLE "downloads" ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "customer_email" TEXT,
ALTER COLUMN "buyer_id" DROP NOT NULL;
