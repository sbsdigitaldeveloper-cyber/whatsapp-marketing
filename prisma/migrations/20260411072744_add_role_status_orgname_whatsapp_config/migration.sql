/*
  Warnings:

  - Added the required column `userId` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Message] DROP CONSTRAINT [Message_contactId_fkey];

-- AlterTable
ALTER TABLE [dbo].[Campaign] ADD [phoneNumberId] NVARCHAR(1000) NOT NULL CONSTRAINT [Campaign_phoneNumberId_df] DEFAULT '';

-- AlterTable
ALTER TABLE [dbo].[Message] ALTER COLUMN [campaignId] INT NULL;

-- ✅ userId DEFAULT 1 ke saath add karo
ALTER TABLE [dbo].[Message] ADD 
[createdAt] DATETIME2 NOT NULL CONSTRAINT [Message_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
[userId] INT NOT NULL CONSTRAINT [Message_userId_df] DEFAULT 1;

-- ✅ Default constraint hata do
DECLARE @constraintName NVARCHAR(256)
SELECT @constraintName = name 
FROM sys.default_constraints 
WHERE parent_object_id = OBJECT_ID('[dbo].[Message]') 
AND col_name(parent_object_id, parent_column_id) = 'userId'

IF @constraintName IS NOT NULL
  EXEC('ALTER TABLE [dbo].[Message] DROP CONSTRAINT ' + @constraintName)

-- AlterTable
ALTER TABLE [dbo].[User] ADD [orgName] NVARCHAR(1000),
[role] NVARCHAR(1000) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'CLIENT',
[status] NVARCHAR(1000) NOT NULL CONSTRAINT [User_status_df] DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE [dbo].[WhatsAppConfig] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] INT NOT NULL,
    [phoneNumberId] NVARCHAR(1000) NOT NULL,
    [accessToken] NVARCHAR(1000) NOT NULL,
    [verifyToken] NVARCHAR(1000) NOT NULL,
    [displayNumber] NVARCHAR(1000) NOT NULL,
    [businessId] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [WhatsAppConfig_isActive_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [WhatsAppConfig_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [WhatsAppConfig_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [WhatsAppConfig_userId_key] UNIQUE NONCLUSTERED ([userId])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [WhatsAppConfig_userId_idx] ON [dbo].[WhatsAppConfig]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [WhatsAppConfig_phoneNumberId_idx] ON [dbo].[WhatsAppConfig]([phoneNumberId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Campaign_phoneNumberId_idx] ON [dbo].[Campaign]([phoneNumberId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Message_userId_idx] ON [dbo].[Message]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_email_idx] ON [dbo].[User]([email]);

-- AddForeignKey
ALTER TABLE [dbo].[WhatsAppConfig] ADD CONSTRAINT [WhatsAppConfig_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Message] ADD CONSTRAINT [Message_contactId_fkey] FOREIGN KEY ([contactId]) REFERENCES [dbo].[Contact]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Message] ADD CONSTRAINT [Message_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH