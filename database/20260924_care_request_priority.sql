-- Additive migration. Run on the application's database before starting the new API.
-- Retains all requests and preserves legacy priority labels stored in notes.
SET XACT_ABORT ON;
BEGIN TRY
  BEGIN TRANSACTION;
  IF COL_LENGTH('dbo.CareRequests', 'Priority') IS NULL
  BEGIN
    ALTER TABLE dbo.CareRequests ADD Priority NVARCHAR(20) NOT NULL
      CONSTRAINT DF_CareRequests_Priority DEFAULT 'NORMAL' WITH VALUES;
    EXEC sys.sp_executesql N'
      UPDATE dbo.CareRequests SET Priority = CASE
        WHEN CustomerNote LIKE N''%[[]KHẨN CẤP]%'' THEN ''URGENT''
        WHEN CustomerNote LIKE N''%[[]CẦN LƯU Ý]%'' THEN ''ATTENTION''
        ELSE ''NORMAL'' END;
      ALTER TABLE dbo.CareRequests ADD CONSTRAINT CK_CareRequests_Priority
        CHECK (Priority IN (''NORMAL'', ''ATTENTION'', ''URGENT''));
    ';
  END;
  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
