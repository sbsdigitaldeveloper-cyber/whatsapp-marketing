BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Message] ADD [deliveredAt] DATETIME2,
[readAt] DATETIME2;

-- CreateIndex
CREATE NONCLUSTERED INDEX [Message_whatsappMsgId_idx] ON [dbo].[Message]([whatsappMsgId]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
