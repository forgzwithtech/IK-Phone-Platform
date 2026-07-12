using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IKPhones.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCategoryRelationships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeviceFamilies_Categories_CategoryId",
                table: "DeviceFamilies");

            migrationBuilder.AddForeignKey(
                name: "FK_DeviceFamilies_Categories_CategoryId",
                table: "DeviceFamilies",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeviceFamilies_Categories_CategoryId",
                table: "DeviceFamilies");

            migrationBuilder.AddForeignKey(
                name: "FK_DeviceFamilies_Categories_CategoryId",
                table: "DeviceFamilies",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
