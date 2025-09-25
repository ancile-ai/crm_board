-- CreateEnum
CREATE TYPE "public"."TodoPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "public"."TodoRole" AS ENUM ('VIEWER', 'EDITOR', 'OWNER');

-- CreateTable
CREATE TABLE "public"."Todo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "public"."TodoPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" TEXT NOT NULL,
    "assignedToId" TEXT,

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TodoCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6b7280',

    CONSTRAINT "TodoCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TodoComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "todoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TodoComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TodoCollaborator" (
    "id" TEXT NOT NULL,
    "role" "public"."TodoRole" NOT NULL DEFAULT 'VIEWER',
    "todoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TodoCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_TodoToTodoCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TodoToTodoCategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Todo_dueDate_idx" ON "public"."Todo"("dueDate");

-- CreateIndex
CREATE INDEX "Todo_completed_idx" ON "public"."Todo"("completed");

-- CreateIndex
CREATE INDEX "Todo_assignedToId_idx" ON "public"."Todo"("assignedToId");

-- CreateIndex
CREATE INDEX "Todo_creatorId_idx" ON "public"."Todo"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "TodoCategory_name_key" ON "public"."TodoCategory"("name");

-- CreateIndex
CREATE INDEX "TodoCategory_name_idx" ON "public"."TodoCategory"("name");

-- CreateIndex
CREATE INDEX "TodoComment_todoId_idx" ON "public"."TodoComment"("todoId");

-- CreateIndex
CREATE INDEX "TodoComment_userId_idx" ON "public"."TodoComment"("userId");

-- CreateIndex
CREATE INDEX "TodoCollaborator_todoId_idx" ON "public"."TodoCollaborator"("todoId");

-- CreateIndex
CREATE INDEX "TodoCollaborator_userId_idx" ON "public"."TodoCollaborator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TodoCollaborator_todoId_userId_key" ON "public"."TodoCollaborator"("todoId", "userId");

-- CreateIndex
CREATE INDEX "_TodoToTodoCategory_B_index" ON "public"."_TodoToTodoCategory"("B");

-- AddForeignKey
ALTER TABLE "public"."Todo" ADD CONSTRAINT "Todo_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Todo" ADD CONSTRAINT "Todo_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TodoComment" ADD CONSTRAINT "TodoComment_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "public"."Todo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TodoComment" ADD CONSTRAINT "TodoComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TodoCollaborator" ADD CONSTRAINT "TodoCollaborator_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "public"."Todo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TodoCollaborator" ADD CONSTRAINT "TodoCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_TodoToTodoCategory" ADD CONSTRAINT "_TodoToTodoCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Todo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_TodoToTodoCategory" ADD CONSTRAINT "_TodoToTodoCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."TodoCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
