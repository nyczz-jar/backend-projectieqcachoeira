CREATE TABLE "Transacao" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transacao_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Transacao_data_idx" ON "Transacao"("data");
