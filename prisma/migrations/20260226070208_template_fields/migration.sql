BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Campaign] ADD [messageType] NVARCHAR(1000) NOT NULL CONSTRAINT [Campaign_messageType_df] DEFAULT 'TEXT',
[templateLanguage] NVARCHAR(1000) CONSTRAINT [Campaign_templateLanguage_df] DEFAULT 'en_US',
[templateName] NVARCHAR(1000),
[templateParams] NVARCHAR(1000);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
