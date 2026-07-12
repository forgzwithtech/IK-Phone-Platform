using Microsoft.EntityFrameworkCore;
using IKPhones.Core.Entities;
using IKPhones.Core.Enums;
using EmberzBackend.Enums; 

namespace IKPhones.Infrastructure.Data;

public class IKPhonesDbContext : DbContext
{
    public IKPhonesDbContext(DbContextOptions<IKPhonesDbContext> options) : base(options)
    {
    }

    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<DeviceFamily> DeviceFamilies => Set<DeviceFamily>();
    public DbSet<DeviceVariant> DeviceVariants => Set<DeviceVariant>();
    public DbSet<InventoryUnit> InventoryUnits => Set<InventoryUnit>();
    public DbSet<DeviceValuation> DeviceValuations => Set<DeviceValuation>();
    public DbSet<ValuationFormulaConfig> ValuationFormulaConfigs => Set<ValuationFormulaConfig>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<TradeInLead> TradeInLeads => Set<TradeInLead>();
    
    // ─── NEW: SYSTEM PERSONNEL TABLE ───
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ─── USER CONFIGURATION ───
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Username).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.Username).IsUnique(); // Usernames must be unique
            entity.Property(e => e.Role).IsRequired().HasMaxLength(20);
        });

        // (Keep all your other existing configurations exactly the same below here)
        modelBuilder.Entity<Brand>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.HasMany(b => b.DeviceFamilies).WithOne(df => df.Brand)
                  .HasForeignKey(df => df.BrandId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DeviceFamily>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(150);
            entity.HasMany(df => df.Variants).WithOne(dv => dv.DeviceFamily)
                  .HasForeignKey(dv => dv.DeviceFamilyId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DeviceVariant>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.StorageCapacity).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Color).IsRequired().HasMaxLength(50);
            entity.HasMany(dv => dv.InventoryUnits).WithOne(iu => iu.Variant)
                  .HasForeignKey(iu => iu.DeviceVariantId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<InventoryUnit>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.SerialNumber).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.SerialNumber).IsUnique();
            entity.Property(e => e.SellingPrice).HasPrecision(18, 2);

            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.RetailState).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.ConditionGrade).HasConversion<string>().HasMaxLength(30);
        });

        modelBuilder.Entity<DeviceValuation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ModelName).IsRequired().HasMaxLength(150);
            entity.Property(e => e.CalculatedValue).HasPrecision(18, 2);
            entity.Property(e => e.FinalApprovedValue).HasPrecision(18, 2);
            entity.Property(e => e.BodyCondition).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.ScreenCondition).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.ImageUrls).HasColumnType("text[]");
        });

        modelBuilder.Entity<ValuationFormulaConfig>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ModelName).IsRequired().HasMaxLength(150);
            entity.Property(e => e.BaseValue).HasPrecision(18, 2);
            entity.Property(e => e.MonthlyDepreciationMultiplier).HasPrecision(5, 4);
            entity.Property(e => e.MarketDemandFactor).HasPrecision(3, 2);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).IsRequired().HasMaxLength(100);
            entity.Property(c => c.Slug).IsRequired().HasMaxLength(100);
        });
        
        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CustomerName).IsRequired().HasMaxLength(150);
            entity.Property(e => e.CustomerEmail).IsRequired().HasMaxLength(150);
            entity.Property(e => e.CustomerPhone).IsRequired().HasMaxLength(50);
            entity.Property(e => e.DeliveryAddress).HasMaxLength(500);
            entity.Property(e => e.TotalAmount).HasPrecision(18, 2);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(30);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.LockedPrice).HasPrecision(18, 2);
            entity.HasOne(oi => oi.Order).WithMany(o => o.Items).HasForeignKey(oi => oi.OrderId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(oi => oi.InventoryUnit).WithMany().HasForeignKey(oi => oi.InventoryUnitId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TradeInLead>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CustomerName).IsRequired().HasMaxLength(150);
            entity.Property(e => e.CustomerEmail).IsRequired().HasMaxLength(150);
            entity.Property(e => e.CustomerPhone).IsRequired().HasMaxLength(50);
            entity.Property(e => e.QuotedValue).HasPrecision(18, 2);
            entity.HasOne(t => t.Valuation).WithMany().HasForeignKey(t => t.DeviceValuationId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}