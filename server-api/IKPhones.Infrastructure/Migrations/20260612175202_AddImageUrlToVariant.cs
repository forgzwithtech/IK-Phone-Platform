using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IKPhones.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddImageUrlToVariant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "DeviceVariants",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "DeviceVariants");
        }
    }
}
