BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Contact] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000),
    [phone] NVARCHAR(1000) NOT NULL,
    [userId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Contact_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Contact_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Contact_userId_phone_key] UNIQUE NONCLUSTERED ([userId],[phone])
);

-- CreateTable
CREATE TABLE [dbo].[Campaign] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [message] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Campaign_status_df] DEFAULT 'PENDING',
    [userId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Campaign_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Campaign_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Message] (
    [id] INT NOT NULL IDENTITY(1,1),
    [status] NVARCHAR(1000) NOT NULL,
    [sentAt] DATETIME2,
    [campaignId] INT NOT NULL,
    [contactId] INT NOT NULL,
    CONSTRAINT [Message_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Contact_userId_idx] ON [dbo].[Contact]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Campaign_userId_idx] ON [dbo].[Campaign]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Message_campaignId_idx] ON [dbo].[Message]([campaignId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Message_contactId_idx] ON [dbo].[Message]([contactId]);

-- AddForeignKey
ALTER TABLE [dbo].[Contact] ADD CONSTRAINT [Contact_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Campaign] ADD CONSTRAINT [Campaign_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Message] ADD CONSTRAINT [Message_contactId_fkey] FOREIGN KEY ([contactId]) REFERENCES [dbo].[Contact]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Message] ADD CONSTRAINT [Message_campaignId_fkey] FOREIGN KEY ([campaignId]) REFERENCES [dbo].[Campaign]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
