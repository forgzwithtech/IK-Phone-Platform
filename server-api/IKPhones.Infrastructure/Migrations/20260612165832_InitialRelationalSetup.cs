using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IKPhones.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialRelationalSetup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Brands",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Brands", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DeviceValuations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ModelName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    AgeInMonths = table.Column<int>(type: "integer", nullable: false),
                    BodyCondition = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ScreenCondition = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    CalculatedValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    FinalApprovedValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    IsApprovedByAdmin = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ImageUrls = table.Column<List<string>>(type: "text[]", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeviceValuations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ValuationFormulaConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ModelName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    BaseValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    MonthlyDepreciationMultiplier = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: false),
                    MarketDemandFactor = table.Column<decimal>(type: "numeric(3,2)", precision: 3, scale: 2, nullable: false),
                    LastUpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ValuationFormulaConfigs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DeviceFamilies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BrandId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeviceFamilies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeviceFamilies_Brands_BrandId",
                        column: x => x.BrandId,
                        principalTable: "Brands",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DeviceFamilies_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DeviceVariants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DeviceFamilyId = table.Column<Guid>(type: "uuid", nullable: false),
                    StorageCapacity = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Color = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeviceVariants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeviceVariants_DeviceFamilies_DeviceFamilyId",
                        column: x => x.DeviceFamilyId,
                        principalTable: "DeviceFamilies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "InventoryUnits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DeviceVariantId = table.Column<Guid>(type: "uuid", nullable: false),
                    SerialNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SellingPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    RetailState = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ConditionGrade = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ReservedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReservedBySessionId = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryUnits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InventoryUnits_DeviceVariants_DeviceVariantId",
                        column: x => x.DeviceVariantId,
                        principalTable: "DeviceVariants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DeviceFamilies_BrandId",
                table: "DeviceFamilies",
                column: "BrandId");

            migrationBuilder.CreateIndex(
                name: "IX_DeviceFamilies_CategoryId",
                table: "DeviceFamilies",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_DeviceVariants_DeviceFamilyId",
                table: "DeviceVariants",
                column: "DeviceFamilyId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryUnits_DeviceVariantId",
                table: "InventoryUnits",
                column: "DeviceVariantId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryUnits_SerialNumber",
                table: "InventoryUnits",
                column: "SerialNumber",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DeviceValuations");

            migrationBuilder.DropTable(
                name: "InventoryUnits");

            migrationBuilder.DropTable(
                name: "ValuationFormulaConfigs");

            migrationBuilder.DropTable(
                name: "DeviceVariants");

            migrationBuilder.DropTable(
                name: "DeviceFamilies");

            migrationBuilder.DropTable(
                name: "Brands");

            migrationBuilder.DropTable(
                name: "Categories");
        }
    }
}
