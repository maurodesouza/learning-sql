-- CreateTable
CREATE TABLE "placeholder" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "placeholder_pkey" PRIMARY KEY ("id")
);
