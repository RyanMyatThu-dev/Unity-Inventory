using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace IMS.Database.IMSDbContextModels;

public partial class IMSDbContext : DbContext
{
    public IMSDbContext()
    {
    }

    public IMSDbContext(DbContextOptions<IMSDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<TblBusiness> TblBusinesses { get; set; }

    public virtual DbSet<TblCustomer> TblCustomers { get; set; }

    public virtual DbSet<TblCustomerPrice> TblCustomerPrices { get; set; }

    public virtual DbSet<TblCustomerSummary> TblCustomerSummaries { get; set; }

    public virtual DbSet<TblInventory> TblInventories { get; set; }

    public virtual DbSet<TblInventorySummary> TblInventorySummaries { get; set; }

    public virtual DbSet<TblReport> TblReports { get; set; }

    public virtual DbSet<TblUser> TblUsers { get; set; }

    public virtual DbSet<TblUserBusiness> TblUserBusinesses { get; set; }

    public virtual DbSet<TblUserToken> TblUserTokens { get; set; }

    public virtual DbSet<TblVoucher> TblVouchers { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=.;Database=IMS_NEW;User Id=sa;Password=sasa@123;TrustServerCertificate=True");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TblBusiness>(entity =>
        {
            entity.HasKey(e => e.BusinessId).HasName("PK__Tbl_Busi__F1EAA36EEC53DBFB");

            entity.ToTable("Tbl_Businesses");

            entity.Property(e => e.BusinessName).HasMaxLength(100);
            entity.Property(e => e.SubscriptionTier)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasDefaultValue("Free");
        });

        modelBuilder.Entity<TblCustomer>(entity =>
        {
            entity.HasKey(e => e.CustomerId).HasName("PK__Tbl_Cust__A4AE64D8295BE687");

            entity.ToTable("Tbl_Customers");

            entity.HasIndex(e => e.BusinessId, "IX_Tbl_Customers_BusinessId");

            entity.Property(e => e.Address).HasMaxLength(50);
            entity.Property(e => e.CustomerName).HasMaxLength(50);
            entity.Property(e => e.Phone)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.TotalItems).HasDefaultValue(0);

            entity.HasOne(d => d.Business).WithMany(p => p.TblCustomers)
                .HasForeignKey(d => d.BusinessId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Tbl_Customers_Business");
        });

        modelBuilder.Entity<TblCustomerPrice>(entity =>
        {
            entity.HasKey(e => e.CustomerPriceId).HasName("PK__Tbl_Cust__5472584ABB5AB716");

            entity.ToTable("Tbl_CustomerPrices");

            entity.Property(e => e.SellPrice).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Business).WithMany(p => p.TblCustomerPrices)
                .HasForeignKey(d => d.BusinessId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Tbl_CustomerPrices_Business");

            entity.HasOne(d => d.Customer).WithMany(p => p.TblCustomerPrices)
                .HasForeignKey(d => d.CustomerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Tbl_CustomerPrices_Customer");

            entity.HasOne(d => d.Inventory).WithMany(p => p.TblCustomerPrices)
                .HasForeignKey(d => d.InventoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Tbl_CustomerPrices_Inventory");
        });

        modelBuilder.Entity<TblCustomerSummary>(entity =>
        {
            entity.HasKey(e => e.SummaryId).HasName("PK__Tbl_Cust__DAB10E2F3E5CB120");

            entity.ToTable("Tbl_CustomerSummary");

            entity.Property(e => e.LastTransactionDate).HasColumnType("datetime");
            entity.Property(e => e.OutstandingBalance)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalPurchased)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Business).WithMany(p => p.TblCustomerSummaries)
                .HasForeignKey(d => d.BusinessId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Tbl_CustSummary_Business");

            entity.HasOne(d => d.Customer).WithMany(p => p.TblCustomerSummaries)
                .HasForeignKey(d => d.CustomerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Tbl_CustSummary_Customer");
        });

        modelBuilder.Entity<TblInventory>(entity =>
        {
            entity.HasKey(e => e.InventoryId).HasName("PK__Tbl_Inve__F5FDE6B39F029373");

            entity.ToTable("Tbl_Inventories");

            entity.HasIndex(e => e.BusinessId, "IX_Tbl_Inventories_BusinessId");

            entity.Property(e => e.DeleteFlag).HasDefaultValue(false);
            entity.Property(e => e.InventoryName).HasMaxLength(50);
            entity.Property(e => e.Price).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Business).WithMany(p => p.TblInventories)
                .HasForeignKey(d => d.BusinessId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Tbl_Inventories_Business");
        });

        modelBuilder.Entity<TblInventorySummary>(entity =>
        {
            entity.HasKey(e => e.SummaryId).HasName("PK__Tbl_Inve__DAB10E2F52C7CE2C");

            entity.ToTable("Tbl_InventorySummary");

            entity.Property(e => e.CurrentStock).HasDefaultValue(0);
            entity.Property(e => e.LastUpdated)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.Business).WithMany(p => p.TblInventorySummaries)
                .HasForeignKey(d => d.BusinessId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Tbl_InvSummary_Business");

            entity.HasOne(d => d.Inventory).WithMany(p => p.TblInventorySummaries)
                .HasForeignKey(d => d.InventoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Tbl_InvSummary_Inventory");
        });

        modelBuilder.Entity<TblReport>(entity =>
        {
            entity.HasKey(e => e.ReportId).HasName("PK__Tbl_Repo__D5BD4805122FED8C");

            entity.ToTable("Tbl_Reports");

            entity.HasIndex(e => e.BusinessId, "IX_Tbl_Reports_BusinessId");

            entity.Property(e => e.Remarks).HasMaxLength(200);
            entity.Property(e => e.ReportDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.TotalAmount)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Business).WithMany(p => p.TblReports)
                .HasForeignKey(d => d.BusinessId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Tbl_Reports_Business");

            entity.HasOne(d => d.Customer).WithMany(p => p.TblReports)
                .HasForeignKey(d => d.CustomerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Tbl_Reports_Customer");
        });

        modelBuilder.Entity<TblUser>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__Tbl_User__1788CC4CE2DC8A5F");

            entity.ToTable("Tbl_Users");

            entity.HasIndex(e => e.Email, "UQ__Tbl_User__A9D10534EAB8CDCF").IsUnique();

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.Name).HasMaxLength(50);
            entity.Property(e => e.PasswordHash).HasMaxLength(255);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
        });

        modelBuilder.Entity<TblUserBusiness>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.BusinessId }).HasName("PK__Tbl_User__E896667A96DAE2D1");

            entity.ToTable("Tbl_UserBusinesses");

            entity.Property(e => e.Role)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasDefaultValue("Owner");

            entity.HasOne(d => d.Business).WithMany(p => p.TblUserBusinesses)
                .HasForeignKey(d => d.BusinessId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Tbl_UserBusinesses_Businesses");

            entity.HasOne(d => d.User).WithMany(p => p.TblUserBusinesses)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Tbl_UserBusinesses_Users");
        });

        modelBuilder.Entity<TblUserToken>(entity =>
        {
            entity.HasKey(e => e.TokenId).HasName("PK__Tbl_User__658FEEEABCF98299");

            entity.ToTable("Tbl_UserTokens");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.ExpiryDate).HasColumnType("datetime");
            entity.Property(e => e.IsRevoked).HasDefaultValue(false);
            entity.Property(e => e.RefreshToken).HasMaxLength(500);
            entity.Property(e => e.TokenHash).HasMaxLength(500);

            entity.HasOne(d => d.User).WithMany(p => p.TblUserTokens)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Tbl_UserTokens_Users");
        });

        modelBuilder.Entity<TblVoucher>(entity =>
        {
            entity.HasKey(e => e.VoucherId).HasName("PK__Tbl_Vouc__3AEE792164B1B440");

            entity.ToTable("Tbl_Vouchers");

            entity.HasIndex(e => e.ReportId, "IX_Tbl_Vouchers_ReportId");

            entity.Property(e => e.SellPrice).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.SubTotal).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Business).WithMany(p => p.TblVouchers)
                .HasForeignKey(d => d.BusinessId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Tbl_Vouchers_Business");

            entity.HasOne(d => d.Inventory).WithMany(p => p.TblVouchers)
                .HasForeignKey(d => d.InventoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Tbl_Vouchers_Inventory");

            entity.HasOne(d => d.Report).WithMany(p => p.TblVouchers)
                .HasForeignKey(d => d.ReportId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Tbl_Vouchers_Report");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
