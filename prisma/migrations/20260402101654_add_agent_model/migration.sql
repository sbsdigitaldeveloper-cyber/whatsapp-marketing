BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Contact] ADD [assignedAgentId] INT;

-- CreateTable
CREATE TABLE [dbo].[Agent] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [userId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Agent_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Agent_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Agent_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Agent_userId_idx] ON [dbo].[Agent]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Contact_assignedAgentId_idx] ON [dbo].[Contact]([assignedAgentId]);

-- AddForeignKey
ALTER TABLE [dbo].[Agent] ADD CONSTRAINT [Agent_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Contact] ADD CONSTRAINT [Contact_assignedAgentId_fkey] FOREIGN KEY ([assignedAgentId]) REFERENCES [dbo].[Agent]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
