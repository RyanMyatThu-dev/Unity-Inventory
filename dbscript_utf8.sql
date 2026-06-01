-- Database Switch to PostgreSQL Initial Script
-- Matches existing C# entity models and naming conventions exactly.
-- PascalCase identifiers are double-quoted to ensure case-sensitive matching for EF Core.

-- 1. Helper function and triggers to simulate MS SQL Server's 'rowversion' / 'timestamp' columns
CREATE OR REPLACE FUNCTION update_version_stamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW."VersionStamp" := decode(md5(random()::text), 'hex');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Define tables in dependency order

-- Tbl_Users
CREATE TABLE "Tbl_Users" (
    "UserId" SERIAL PRIMARY KEY,
    "Username" VARCHAR(50) NULL,
    "Name" VARCHAR(50) NOT NULL,
    "Email" VARCHAR(100) NOT NULL,
    "PasswordHash" VARCHAR(255) NOT NULL,
    "ImageId" VARCHAR(255) NULL,
    "ImageUrl" VARCHAR(2048) NULL,
    "AccountType" VARCHAR(50) NULL,
    "CreatedAt" TIMESTAMP DEFAULT timezone('utc', now()) NOT NULL,
    "DeleteFlag" BOOLEAN DEFAULT FALSE NOT NULL,
    "UpdatedAt" TIMESTAMP NULL
);

CREATE UNIQUE INDEX "UQ__Tbl_User__A9D10534EAB8CDCF" ON "Tbl_Users" ("Email");

-- Tbl_Businesses
CREATE TABLE "Tbl_Businesses" (
    "BusinessId" SERIAL PRIMARY KEY,
    "BusinessName" VARCHAR(100) NOT NULL,
    "SubscriptionTier" VARCHAR(50) DEFAULT 'Free' NULL,
    "OwnerId" INTEGER NOT NULL
);

-- TblCategory
CREATE TABLE "TblCategory" (
    "CategoryId" SERIAL PRIMARY KEY,
    "BusinessId" INTEGER NOT NULL,
    "CategoryName" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(255) NULL,
    "ParentCategoryId" INTEGER NULL,
    "CreatedAt" TIMESTAMP DEFAULT timezone('utc', now()) NOT NULL,
    "UpdatedAt" TIMESTAMP NULL,
    "DeleteFlag" BOOLEAN DEFAULT FALSE NOT NULL,
    CONSTRAINT "FK_Category_Business" FOREIGN KEY ("BusinessId") REFERENCES "Tbl_Businesses" ("BusinessId"),
    CONSTRAINT "FK_Category_Parent" FOREIGN KEY ("ParentCategoryId") REFERENCES "TblCategory" ("CategoryId")
);

CREATE INDEX "IX_TblCategory_ParentCategoryId" ON "TblCategory" ("ParentCategoryId");
CREATE UNIQUE INDEX "UQ_Category_Name" ON "TblCategory" ("BusinessId", "CategoryName");

-- Tbl_Customers
CREATE TABLE "Tbl_Customers" (
    "CustomerId" SERIAL PRIMARY KEY,
    "BusinessId" INTEGER NOT NULL,
    "CustomerName" VARCHAR(50) NOT NULL,
    "Phone" VARCHAR(50) NULL,
    "Address" VARCHAR(50) NULL,
    "TotalItems" INTEGER DEFAULT 0 NULL,
    "VersionStamp" BYTEA NOT NULL,
    "ImageUrl" VARCHAR(2048) NULL,
    "ImageId" VARCHAR(255) NULL,
    "CreatedAt" TIMESTAMP NULL,
    "UpdatedAt" TIMESTAMP NULL,
    "DeleteFlag" BOOLEAN DEFAULT FALSE NOT NULL,
    CONSTRAINT "FK_Tbl_Customers_Business" FOREIGN KEY ("BusinessId") REFERENCES "Tbl_Businesses" ("BusinessId")
);

CREATE INDEX "IX_Tbl_Customers_BusinessId" ON "Tbl_Customers" ("BusinessId");

CREATE TRIGGER trigger_update_customer_version
BEFORE INSERT OR UPDATE ON "Tbl_Customers"
FOR EACH ROW EXECUTE FUNCTION update_version_stamp();

-- Tbl_CustomerSummary
CREATE TABLE "Tbl_CustomerSummary" (
    "SummaryId" SERIAL PRIMARY KEY,
    "BusinessId" INTEGER NOT NULL,
    "CustomerId" INTEGER NOT NULL,
    "TotalPurchased" DECIMAL(18,2) DEFAULT 0.0 NULL,
    "OutstandingBalance" DECIMAL(18,2) DEFAULT 0.0 NULL,
    "LastTransactionDate" TIMESTAMP NULL,
    CONSTRAINT "FK_Tbl_CustSummary_Business" FOREIGN KEY ("BusinessId") REFERENCES "Tbl_Businesses" ("BusinessId"),
    CONSTRAINT "FK_Tbl_CustSummary_Customer" FOREIGN KEY ("CustomerId") REFERENCES "Tbl_Customers" ("CustomerId")
);

CREATE INDEX "IX_Tbl_CustomerSummary_BusinessId" ON "Tbl_CustomerSummary" ("BusinessId");
CREATE INDEX "IX_Tbl_CustomerSummary_CustomerId" ON "Tbl_CustomerSummary" ("CustomerId");

-- Tbl_Inventories
CREATE TABLE "Tbl_Inventories" (
    "InventoryId" SERIAL PRIMARY KEY,
    "BusinessId" INTEGER NOT NULL,
    "InventoryName" VARCHAR(50) NOT NULL,
    "Price" DECIMAL(18,2) NOT NULL,
    "DeleteFlag" BOOLEAN DEFAULT FALSE NOT NULL,
    "VersionStamp" BYTEA NOT NULL,
    "ImageUrl" VARCHAR(2048) NULL,
    "ImageId" VARCHAR(255) NULL,
    "CategoryId" INTEGER NULL,
    "CreatedAt" TIMESTAMP NOT NULL,
    "UpdatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "FK_Tbl_Inventories_Business" FOREIGN KEY ("BusinessId") REFERENCES "Tbl_Businesses" ("BusinessId"),
    CONSTRAINT "FK_Inventory_Category" FOREIGN KEY ("CategoryId") REFERENCES "TblCategory" ("CategoryId")
);

CREATE INDEX "IX_Tbl_Inventories_BusinessId" ON "Tbl_Inventories" ("BusinessId");
CREATE INDEX "IX_Tbl_Inventories_CategoryId" ON "Tbl_Inventories" ("CategoryId");

CREATE TRIGGER trigger_update_inventory_version
BEFORE INSERT OR UPDATE ON "Tbl_Inventories"
FOR EACH ROW EXECUTE FUNCTION update_version_stamp();

-- Tbl_CustomerPrices
CREATE TABLE "Tbl_CustomerPrices" (
    "CustomerPriceId" SERIAL PRIMARY KEY,
    "BusinessId" INTEGER NOT NULL,
    "CustomerId" INTEGER NOT NULL,
    "InventoryId" INTEGER NOT NULL,
    "SellPrice" DECIMAL(18,2) NOT NULL,
    CONSTRAINT "FK_Tbl_CustomerPrices_Business" FOREIGN KEY ("BusinessId") REFERENCES "Tbl_Businesses" ("BusinessId"),
    CONSTRAINT "FK_Tbl_CustomerPrices_Customer" FOREIGN KEY ("CustomerId") REFERENCES "Tbl_Customers" ("CustomerId"),
    CONSTRAINT "FK_Tbl_CustomerPrices_Inventory" FOREIGN KEY ("InventoryId") REFERENCES "Tbl_Inventories" ("InventoryId")
);

CREATE INDEX "IX_Tbl_CustomerPrices_BusinessId" ON "Tbl_CustomerPrices" ("BusinessId");
CREATE INDEX "IX_Tbl_CustomerPrices_CustomerId" ON "Tbl_CustomerPrices" ("CustomerId");
CREATE INDEX "IX_Tbl_CustomerPrices_InventoryId" ON "Tbl_CustomerPrices" ("InventoryId");

-- Tbl_InventorySummary
CREATE TABLE "Tbl_InventorySummary" (
    "SummaryId" SERIAL PRIMARY KEY,
    "BusinessId" INTEGER NOT NULL,
    "InventoryId" INTEGER NOT NULL,
    "CurrentStock" INTEGER DEFAULT 0 NULL,
    "LastUpdated" TIMESTAMP DEFAULT timezone('utc', now()) NULL,
    "VersionStamp" BYTEA NOT NULL,
    CONSTRAINT "FK_Tbl_InvSummary_Business" FOREIGN KEY ("BusinessId") REFERENCES "Tbl_Businesses" ("BusinessId"),
    CONSTRAINT "FK_Tbl_InvSummary_Inventory" FOREIGN KEY ("InventoryId") REFERENCES "Tbl_Inventories" ("InventoryId")
);

CREATE INDEX "IX_Tbl_InventorySummary_BusinessId" ON "Tbl_InventorySummary" ("BusinessId");
CREATE INDEX "IX_Tbl_InventorySummary_InventoryId" ON "Tbl_InventorySummary" ("InventoryId");

CREATE TRIGGER trigger_update_invsummary_version
BEFORE INSERT OR UPDATE ON "Tbl_InventorySummary"
FOR EACH ROW EXECUTE FUNCTION update_version_stamp();

-- Tbl_Reports
CREATE TABLE "Tbl_Reports" (
    "ReportId" SERIAL PRIMARY KEY,
    "BusinessId" INTEGER NOT NULL,
    "CustomerId" INTEGER NOT NULL,
    "ReportDate" TIMESTAMP DEFAULT timezone('utc', now()) NULL,
    "TotalAmount" DECIMAL(18,2) DEFAULT 0.0 NOT NULL,
    "Remarks" VARCHAR(200) NULL,
    CONSTRAINT "FK_Tbl_Reports_Business" FOREIGN KEY ("BusinessId") REFERENCES "Tbl_Businesses" ("BusinessId"),
    CONSTRAINT "FK_Tbl_Reports_Customer" FOREIGN KEY ("CustomerId") REFERENCES "Tbl_Customers" ("CustomerId")
);

CREATE INDEX "IX_Tbl_Reports_BusinessId" ON "Tbl_Reports" ("BusinessId");
CREATE INDEX "IX_Tbl_Reports_CustomerId" ON "Tbl_Reports" ("CustomerId");

-- Tbl_RolePermissions
CREATE TABLE "Tbl_RolePermissions" (
    "Id" BIGSERIAL PRIMARY KEY,
    "BusinessId" INTEGER NOT NULL,
    "UserId" INTEGER NULL,
    "RoleName" VARCHAR(50) NULL,
    "MenuCode" VARCHAR(100) NOT NULL,
    "ActionCode" VARCHAR(50) NOT NULL,
    "IsAllowed" BOOLEAN DEFAULT TRUE NOT NULL,
    "IsRevoked" BOOLEAN DEFAULT FALSE NOT NULL,
    "CreatedAt" TIMESTAMP DEFAULT timezone('utc', now()) NULL,
    "UpdatedAt" TIMESTAMP NULL,
    "GrantedByUserId" INTEGER NOT NULL,
    "RevokedByUserId" INTEGER NULL,
    "RevokedAt" TIMESTAMP NULL,
    CONSTRAINT "FK_Permission_Business" FOREIGN KEY ("BusinessId") REFERENCES "Tbl_Businesses" ("BusinessId")
);

CREATE INDEX "IX_Permission_GrantedByUserId" ON "Tbl_RolePermissions" ("GrantedByUserId");
CREATE INDEX "IX_Permission_RevokedByUserId" ON "Tbl_RolePermissions" ("RevokedByUserId");
CREATE INDEX "IX_Tbl_RolePermissions_UserId" ON "Tbl_RolePermissions" ("UserId");
CREATE UNIQUE INDEX "UQ_Permission" ON "Tbl_RolePermissions" ("BusinessId", "RoleName", "UserId", "MenuCode", "ActionCode") WHERE ("RoleName" IS NOT NULL AND "UserId" IS NOT NULL);

-- Tbl_SummaryArchives
CREATE TABLE "Tbl_SummaryArchives" (
    "SummaryId" SERIAL PRIMARY KEY,
    "BusinessId" INTEGER NOT NULL,
    "SummaryType" VARCHAR(20) NOT NULL,
    "PeriodStartDate" DATE NOT NULL,
    "PeriodEndDate" DATE NOT NULL,
    "TotalRevenue" DECIMAL(18,2) NOT NULL,
    "TotalOrders" INTEGER NOT NULL,
    "TotalItemsSold" INTEGER NOT NULL,
    "AverageOrderValue" DECIMAL(18,2) NOT NULL,
    "TopCustomerId" INTEGER NULL,
    "TopCustomerName" VARCHAR(50) NULL,
    "TopCustomerTotal" DECIMAL(18,2) NULL,
    "TopInventoryId" INTEGER NULL,
    "TopInventoryName" VARCHAR(50) NULL,
    "TopInventoryQuantitySold" INTEGER NULL,
    "GeneratedAt" TIMESTAMP DEFAULT timezone('utc', now()) NOT NULL,
    "Source" VARCHAR(50) DEFAULT 'Hangfire' NULL,
    CONSTRAINT "FK_Tbl_SummaryArchives_Business" FOREIGN KEY ("BusinessId") REFERENCES "Tbl_Businesses" ("BusinessId")
);

CREATE INDEX "IX_Tbl_SummaryArchives_BusinessId" ON "Tbl_SummaryArchives" ("BusinessId");
CREATE INDEX "IX_Tbl_SummaryArchives_Lookup" ON "Tbl_SummaryArchives" ("BusinessId", "SummaryType", "PeriodStartDate", "PeriodEndDate");
CREATE INDEX "IX_Tbl_SummaryArchives_Period" ON "Tbl_SummaryArchives" ("BusinessId", "PeriodStartDate", "PeriodEndDate");

-- Tbl_UserBusinesses
CREATE TABLE "Tbl_UserBusinesses" (
    "UserId" INTEGER NOT NULL,
    "BusinessId" INTEGER NOT NULL,
    "Role" VARCHAR(50) DEFAULT 'Owner' NULL,
    PRIMARY KEY ("UserId", "BusinessId"),
    CONSTRAINT "FK_Tbl_UserBusinesses_Businesses" FOREIGN KEY ("BusinessId") REFERENCES "Tbl_Businesses" ("BusinessId"),
    CONSTRAINT "FK_Tbl_UserBusinesses_Users" FOREIGN KEY ("UserId") REFERENCES "Tbl_Users" ("UserId")
);

CREATE INDEX "IX_Tbl_UserBusinesses_BusinessId" ON "Tbl_UserBusinesses" ("BusinessId");

-- Tbl_UserTokens
CREATE TABLE "Tbl_UserTokens" (
    "TokenId" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "RefreshToken" VARCHAR(500) NOT NULL,
    "IsRevoked" BOOLEAN DEFAULT FALSE NULL,
    "ExpiryDate" TIMESTAMP NOT NULL,
    "CreatedAt" TIMESTAMP DEFAULT timezone('utc', now()) NULL,
    "TokenHash" VARCHAR(500) NOT NULL,
    CONSTRAINT "FK_Tbl_UserTokens_Users" FOREIGN KEY ("UserId") REFERENCES "Tbl_Users" ("UserId")
);

CREATE INDEX "IX_Tbl_UserTokens_UserId" ON "Tbl_UserTokens" ("UserId");

-- Tbl_Vouchers
CREATE TABLE "Tbl_Vouchers" (
    "VoucherId" SERIAL PRIMARY KEY,
    "BusinessId" INTEGER NOT NULL,
    "ReportId" INTEGER NOT NULL,
    "InventoryId" INTEGER NOT NULL,
    "Quantity" INTEGER NOT NULL,
    "SellPrice" DECIMAL(18,2) NOT NULL,
    "SubTotal" DECIMAL(18,2) NOT NULL,
    CONSTRAINT "FK_Tbl_Vouchers_Business" FOREIGN KEY ("BusinessId") REFERENCES "Tbl_Businesses" ("BusinessId"),
    CONSTRAINT "FK_Tbl_Vouchers_Inventory" FOREIGN KEY ("InventoryId") REFERENCES "Tbl_Inventories" ("InventoryId"),
    CONSTRAINT "FK_Tbl_Vouchers_Report" FOREIGN KEY ("ReportId") REFERENCES "Tbl_Reports" ("ReportId")
);

CREATE INDEX "IX_Tbl_Vouchers_BusinessId" ON "Tbl_Vouchers" ("BusinessId");
CREATE INDEX "IX_Tbl_Vouchers_InventoryId" ON "Tbl_Vouchers" ("InventoryId");
CREATE INDEX "IX_Tbl_Vouchers_ReportId" ON "Tbl_Vouchers" ("ReportId");
