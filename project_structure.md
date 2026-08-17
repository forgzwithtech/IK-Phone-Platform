# 📁 ik-phones-platform - Project Structure

*Generated on: 8/15/2026, 7:42:58 PM*

## 📋 Quick Overview

| Metric | Value |
|--------|-------|
| 📄 Total Files | 103 |
| 📁 Total Folders | 47 |
| 🌳 Max Depth | 5 levels |
| 🛠️ Tech Stack | React, TypeScript, CSS, Node.js |

## ⭐ Important Files

- 🟡 🚫 **.gitignore** - Git ignore rules
- 🟡 🔒 **package-lock.json** - Dependency lock
- 🔴 📦 **package.json** - Package configuration
- 🔴 📖 **README.md** - Project documentation
- 🟡 🔷 **tsconfig.json** - TypeScript config

## 📊 File Statistics

### By File Type

- 📄 **.cs** (Other files): 51 files (49.5%)
- ⚛️ **.tsx** (React TypeScript files): 14 files (13.6%)
- ⚙️ **.json** (JSON files): 8 files (7.8%)
- 🎨 **.css** (Stylesheets): 7 files (6.8%)
- 🎨 **.svg** (SVG images): 4 files (3.9%)
- 🔷 **.ts** (TypeScript files): 4 files (3.9%)
- 📄 **.csproj** (Other files): 4 files (3.9%)
- 🖼️ **.jpg** (JPEG images): 4 files (3.9%)
- 🚫 **.gitignore** (Git ignore): 1 files (1.0%)
- 📜 **.js** (JavaScript files): 1 files (1.0%)
- 🌐 **.html** (HTML files): 1 files (1.0%)
- 📖 **.md** (Markdown files): 1 files (1.0%)
- 🖼️ **.png** (PNG images): 1 files (1.0%)
- 📄 **.http** (Other files): 1 files (1.0%)
- 📄 **.sln** (Other files): 1 files (1.0%)

### By Category

- **Other**: 57 files (55.3%)
- **React**: 14 files (13.6%)
- **Assets**: 9 files (8.7%)
- **Config**: 8 files (7.8%)
- **Styles**: 7 files (6.8%)
- **TypeScript**: 4 files (3.9%)
- **DevOps**: 1 files (1.0%)
- **JavaScript**: 1 files (1.0%)
- **Web**: 1 files (1.0%)
- **Docs**: 1 files (1.0%)

### 📁 Largest Directories

- **root**: 103 files
- **server-api**: 64 files
- **client-web**: 39 files
- **client-web\src**: 27 files
- **server-api\IKPhones.Api**: 26 files

## 🌳 Directory Structure

```
ik-phones-platform/
├── 📂 client-web/
│   ├── 🟡 🚫 **.gitignore**
│   ├── 📜 eslint.config.js
│   ├── 🌐 index.html
│   ├── 🟡 🔒 **package-lock.json**
│   ├── 🔴 📦 **package.json**
│   ├── 🌐 public/
│   │   ├── 🎨 favicon.svg
│   │   └── 🎨 icons.svg
│   ├── 🔴 📖 **README.md**
│   ├── 📁 src/
│   │   ├── ⚛️ App.tsx
│   │   ├── 📦 assets/
│   │   │   ├── 🖼️ hero.png
│   │   │   ├── 🔷 mockData.ts
│   │   │   ├── 🎨 react.svg
│   │   │   └── 🎨 vite.svg
│   │   ├── 🧩 components/
│   │   │   ├── 📂 admin/
│   │   │   │   └── ⚛️ AdminDashboard.tsx
│   │   │   ├── 📂 cart/
│   │   │   │   ├── 🎨 CartFlyout.module.css
│   │   │   │   └── ⚛️ CartFlyout.tsx
│   │   │   ├── 📂 checkout/
│   │   │   │   ├── 🎨 CheckoutModal.module.css
│   │   │   │   └── ⚛️ CheckoutModal.tsx
│   │   │   ├── 📂 layout/
│   │   │   │   ├── 🎨 Navbar.module.css
│   │   │   │   └── ⚛️ Navbar.tsx
│   │   │   ├── 📂 product/
│   │   │   │   ├── 🎨 ProductOverlay.module.css
│   │   │   │   └── ⚛️ ProductOverlay.tsx
│   │   │   ├── 📂 rider/
│   │   │   │   └── ⚛️ RiderDashboard.tsx
│   │   │   ├── 📂 search/
│   │   │   │   ├── 🎨 Search.module.css
│   │   │   │   └── ⚛️ Search.tsx
│   │   │   ├── 📂 staff/
│   │   │   │   └── ⚛️ StaffDashboard.tsx
│   │   │   └── 🎨 ui/
│   │   │   │   └── ⚛️ icon.tsx
│   │   ├── 📂 context/
│   │   │   └── ⚛️ CartContext.tsx
│   │   ├── 📂 features/
│   │   │   ├── 📂 admin-dashboard/
│   │   │   ├── 📂 device-valuation/
│   │   │   ├── 📂 search/
│   │   │   └── 📂 store-inventory/
│   │   ├── 🎣 hooks/
│   │   │   └── 🔷 useInventorySync.ts
│   │   ├── 🎨 index.css
│   │   ├── ⚛️ main.tsx
│   │   ├── 📄 pages/
│   │   │   ├── 🎨 HomePage.module.css
│   │   │   ├── ⚛️ HomePage.tsx
│   │   │   └── 📂 internal/
│   │   │   │   └── ⚛️ InternalPortal.tsx
│   │   ├── 📂 services/
│   │   │   └── 🔷 api.ts
│   │   ├── 📂 store/
│   │   ├── 🎨 styles/
│   │   └── 📂 types/
│   ├── ⚙️ tsconfig.app.json
│   ├── 🟡 🔷 **tsconfig.json**
│   ├── ⚙️ tsconfig.node.json
│   └── 🔷 vite.config.ts
└── 📂 server-api/
│   ├── 📂 IKPhones.Api/
│   │   ├── ⚙️ appsettings.Development.json
│   │   ├── ⚙️ appsettings.json
│   │   ├── 📂 Controllers/
│   │   │   ├── 📄 AdminInventoryController.cs
│   │   │   ├── 📄 AdminOrdersController.cs
│   │   │   ├── 📄 AuthController.cs
│   │   │   ├── 📄 BrandController.cs
│   │   │   ├── 📄 CategoriesController.cs
│   │   │   ├── 📄 InventoryController.cs
│   │   │   ├── 📄 OrdersController.cs
│   │   │   ├── 📄 ValuationController.cs
│   │   │   └── 📄 WeatherForecastController.cs
│   │   ├── 📂 DTOs/
│   │   │   ├── 📄 AdminInventoryDTOs.cs
│   │   │   ├── 📄 BookingInspectionRequest.cs
│   │   │   └── 📄 CheckoutRequest.cs
│   │   ├── 📂 Hubs/
│   │   │   └── 📄 InventoryHub.cs
│   │   ├── 📄 IKPhones.Api.csproj
│   │   ├── 📄 IKPhones.Api.http
│   │   ├── 📄 Program.cs
│   │   ├── 📂 Properties/
│   │   │   └── ⚙️ launchSettings.json
│   │   ├── 📂 Services/
│   │   │   ├── 📄 FileUploadService.cs
│   │   │   └── 📄 SignalRStockNotifier.cs
│   │   ├── 📄 WeatherForecast.cs
│   │   └── 📂 wwwroot/
│   │   │   └── 📂 uploads/
│   │   │   │   └── 📂 devices/
│   │   │   │   │   ├── 🖼️ 1f46d2b4-03d1-40f1-862e-d9c56e9a96f8_images (8).jpg
│   │   │   │   │   ├── 🖼️ 3a652f21-6aed-40a5-b959-b28e68aa0c88_images (9).jpg
│   │   │   │   │   ├── 🖼️ 77ceddd4-c37c-4117-a2b3-9f91e1cecab5_images (8).jpg
│   │   │   │   │   └── 🖼️ d7f5b3c0-7e41-4277-800b-e5ad4087999b_oppox9.jpg
│   ├── 📂 IKPhones.Application/
│   │   ├── 📄 Class1.cs
│   │   ├── 📄 IKPhones.Application.csproj
│   │   ├── 📂 Interfaces/
│   │   │   ├── 📄 IStockNotifier.cs
│   │   │   └── 📄 IValuationEngine.cs
│   │   └── 📂 Services/
│   │   │   └── 📄 ValuationEngine.cs
│   ├── 📂 IKPhones.Core/
│   │   ├── 📄 Class1.cs
│   │   ├── 📂 Entities/
│   │   │   ├── 📄 Category.cs
│   │   │   ├── 📄 DeviceValuation.cs
│   │   │   ├── 📄 InventoryItem.cs
│   │   │   ├── 📄 Order.cs
│   │   │   ├── 📄 OrderItem.cs
│   │   │   ├── 📄 TradeInLead.cs
│   │   │   ├── 📄 User.cs
│   │   │   └── 📄 ValuationFormulaConfig.cs
│   │   ├── 📂 Enums/
│   │   │   ├── 📄 Brand.cs
│   │   │   ├── 📄 ConditionGrade.cs
│   │   │   ├── 📄 InventoryUnit.cs
│   │   │   ├── 📄 ItemStatus.cs
│   │   │   ├── 📄 OrderStatus.cs
│   │   │   └── 📄 RetailState.cs
│   │   └── 📄 IKPhones.Core.csproj
│   ├── 📂 IKPhones.Infrastructure/
│   │   ├── 📄 Class1.cs
│   │   ├── 📂 Data/
│   │   │   ├── 📄 DbSeeder.cs
│   │   │   └── 📄 IKPhonesDbContext.cs
│   │   ├── 📄 IKPhones.Infrastructure.csproj
│   │   ├── 📂 Migrations/
│   │   │   ├── 📄 20260612165832_InitialRelationalSetup.cs
│   │   │   ├── 📄 20260612165832_InitialRelationalSetup.Designer.cs
│   │   │   ├── 📄 20260612175202_AddImageUrlToVariant.cs
│   │   │   ├── 📄 20260612175202_AddImageUrlToVariant.Designer.cs
│   │   │   ├── 📄 20260614190537_AddECommerceCore.cs
│   │   │   ├── 📄 20260614190537_AddECommerceCore.Designer.cs
│   │   │   ├── 📄 20260615164005_UpdateCategoryRelationships.cs
│   │   │   ├── 📄 20260615164005_UpdateCategoryRelationships.Designer.cs
│   │   │   ├── 📄 20260617074145_AddedUserTable.cs
│   │   │   ├── 📄 20260617074145_AddedUserTable.Designer.cs
│   │   │   └── 📄 IKPhonesDbContextModelSnapshot.cs
│   │   └── 📂 Workers/
│   │   │   └── 📄 ReservationCleanupWorker.cs
│   └── 📄 IKPhones.sln
```

## 📖 Legend

### File Types
- 🚫 DevOps: Git ignore
- 📜 JavaScript: JavaScript files
- 🌐 Web: HTML files
- ⚙️ Config: JSON files
- 🎨 Assets: SVG images
- 📖 Docs: Markdown files
- ⚛️ React: React TypeScript files
- 🖼️ Assets: PNG images
- 🔷 TypeScript: TypeScript files
- 🎨 Styles: Stylesheets
- 📄 Other: Other files
- 🖼️ Assets: JPEG images

### Importance Levels
- 🔴 Critical: Essential project files
- 🟡 High: Important configuration files
- 🔵 Medium: Helpful but not essential files
