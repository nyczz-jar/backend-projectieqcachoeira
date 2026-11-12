CREATE TABLE IF NOT EXISTS "Member" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Member_email_key" ON "Member"("email");

CREATE TABLE "TriagemSocial" (
    "id" SERIAL NOT NULL,
    "membroId" TEXT NOT NULL,
    "dataTriagem" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "demandas" TEXT NOT NULL,
    "notas" TEXT,
    "statusEncaminhamento" TEXT NOT NULL DEFAULT 'Pendente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TriagemSocial_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CursoLocal" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT,
    "descricao" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3),
    "dataTermino" TIMESTAMP(3),
    "statusAprovacao" TEXT NOT NULL DEFAULT 'Pendente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CursoLocal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VagaEmprego" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "empresa" TEXT,
    "descricao" TEXT NOT NULL,
    "requisitos" TEXT NOT NULL,
    "dataPublicacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusAprovacao" TEXT NOT NULL DEFAULT 'Pendente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VagaEmprego_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TriagemSocial_membroId_idx" ON "TriagemSocial"("membroId");
CREATE INDEX "TriagemSocial_statusEncaminhamento_idx" ON "TriagemSocial"("statusEncaminhamento");
CREATE INDEX "TriagemSocial_createdAt_idx" ON "TriagemSocial"("createdAt");
CREATE INDEX "CursoLocal_statusAprovacao_createdAt_idx" ON "CursoLocal"("statusAprovacao", "createdAt");
CREATE INDEX "VagaEmprego_statusAprovacao_dataPublicacao_idx" ON "VagaEmprego"("statusAprovacao", "dataPublicacao");

ALTER TABLE "TriagemSocial"
ADD CONSTRAINT "TriagemSocial_membroId_fkey"
FOREIGN KEY ("membroId") REFERENCES "Member"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
