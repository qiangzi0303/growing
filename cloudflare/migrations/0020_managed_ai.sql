CREATE TABLE GrowingAIModels (
 Id TEXT PRIMARY KEY, Model TEXT NOT NULL, Endpoint TEXT NOT NULL,
 EncryptedKey TEXT NOT NULL, KeyHint TEXT NOT NULL, Enabled INTEGER NOT NULL CHECK(Enabled IN (0,1)),
 Revision INTEGER NOT NULL CHECK(Revision>0), Voice TEXT, UpdatedAt TEXT NOT NULL
);
CREATE TABLE GrowingAIModelHistory (
 ConfigId TEXT NOT NULL, Revision INTEGER NOT NULL, Model TEXT NOT NULL,
 PRIMARY KEY(ConfigId,Revision)
);
CREATE TABLE GrowingAIUsage (
 UserId TEXT NOT NULL REFERENCES GrowingUsers(Id), RequestId TEXT NOT NULL,
 ConfigId TEXT NOT NULL, ConfigRevision INTEGER NOT NULL, Model TEXT NOT NULL,
 Feature TEXT NOT NULL, Status TEXT NOT NULL CHECK(Status IN ('success','error','cancelled')),
 Source TEXT NOT NULL CHECK(Source IN ('client','server')),
 InputTokens INTEGER, OutputTokens INTEGER, TotalTokens INTEGER, ProviderRequestId TEXT,
 CreatedAt TEXT NOT NULL,
 PRIMARY KEY(UserId,RequestId),
 FOREIGN KEY(ConfigId,ConfigRevision) REFERENCES GrowingAIModelHistory(ConfigId,Revision),
 CHECK((InputTokens IS NULL AND OutputTokens IS NULL AND TotalTokens IS NULL) OR
 (InputTokens>=0 AND OutputTokens>=0 AND TotalTokens=InputTokens+OutputTokens))
);
CREATE INDEX IX_GrowingAIUsage_Date ON GrowingAIUsage(CreatedAt,UserId);
