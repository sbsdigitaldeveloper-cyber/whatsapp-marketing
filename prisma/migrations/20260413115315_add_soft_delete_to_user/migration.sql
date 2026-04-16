BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Agent] DROP CONSTRAINT [Agent_userId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Campaign] DROP CONSTRAINT [Campaign_userId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Contact] DROP CONSTRAINT [Contact_userId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[WhatsAppConfig] DROP CONSTRAINT [WhatsAppConfig_userId_fkey];

-- AlterTable
ALTER TABLE [dbo].[Agent] ADD [deletedAt] DATETIME2,
[isDeleted] BIT NOT NULL CONSTRAINT [Agent_isDeleted_df] DEFAULT 0,
[updatedAt] DATETIME2;

-- AlterTable
ALTER TABLE [dbo].[Campaign] ADD [updatedAt] DATETIME2;

-- AlterTable
ALTER TABLE [dbo].[Contact] ADD [updatedAt] DATETIME2;

-- AlterTable
ALTER TABLE [dbo].[User] ADD [deletedAt] DATETIME2,
[deletedBy] INT,
[isDeleted] BIT NOT NULL CONSTRAINT [User_isDeleted_df] DEFAULT 0,
[suspendedAt] DATETIME2,
[suspendedBy] INT,
[updatedAt] DATETIME2;

-- AlterTable
ALTER TABLE [dbo].[WhatsAppConfig] ADD [updatedAt] DATETIME2;

-- CreateIndex
CREATE NONCLUSTERED INDEX [Agent_isDeleted_idx] ON [dbo].[Agent]([isDeleted]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Campaign_status_idx] ON [dbo].[Campaign]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Message_status_idx] ON [dbo].[Message]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_isDeleted_idx] ON [dbo].[User]([isDeleted]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_status_idx] ON [dbo].[User]([status]);

-- AddForeignKey
ALTER TABLE [dbo].[WhatsAppConfig] ADD CONSTRAINT [WhatsAppConfig_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Agent] ADD CONSTRAINT [Agent_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Contact] ADD CONSTRAINT [Contact_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Campaign] ADD CONSTRAINT [Campaign_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
