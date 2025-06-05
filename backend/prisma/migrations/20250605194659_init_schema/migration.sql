-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('WAREHOUSE_KEEPER', 'MANAGER');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'PENDING_ASSEMBLY', 'ASSEMBLING', 'READY_FOR_SHIPMENT', 'SHIPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('RECEIPT', 'SHIPMENT', 'TRANSFER', 'ADJUSTMENT_PLUS', 'ADJUSTMENT_MINUS', 'INVENTORY_COUNT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'WAREHOUSE_KEEPER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "description" TEXT,
    "unit_of_measure" TEXT NOT NULL,
    "purchase_price" DECIMAL(10,2),
    "min_stock_level" INTEGER,
    "max_stock_level" INTEGER,
    "category_id" TEXT,
    "supplier_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageCell" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "max_items_capacity" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageCell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CellContent" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "last_updated_at" TIMESTAMP(3) NOT NULL,
    "product_id" TEXT NOT NULL,
    "storage_cell_id" TEXT NOT NULL,

    CONSTRAINT "CellContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboundShipment" (
    "id" TEXT NOT NULL,
    "document_number" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PLANNED',
    "expected_date" TIMESTAMP(3),
    "actual_receipt_date" TIMESTAMP(3),
    "notes" TEXT,
    "supplier_id" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InboundShipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboundShipmentItem" (
    "id" TEXT NOT NULL,
    "quantity_expected" INTEGER NOT NULL,
    "quantity_received" INTEGER NOT NULL,
    "purchase_price_at_receipt" DECIMAL(10,2),
    "inbound_shipment_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "target_storage_cell_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InboundShipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboundShipment" (
    "id" TEXT NOT NULL,
    "document_number" TEXT NOT NULL,
    "customer_details" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "planned_shipping_date" TIMESTAMP(3),
    "actual_shipping_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboundShipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboundShipmentItem" (
    "id" TEXT NOT NULL,
    "quantity_ordered" INTEGER NOT NULL,
    "quantity_shipped" INTEGER NOT NULL DEFAULT 0,
    "selling_price_at_shipment" DECIMAL(10,2),
    "outbound_shipment_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboundShipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "quantity_changed" INTEGER NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "reason" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "product_id" TEXT NOT NULL,
    "storage_cell_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "inbound_shipment_item_id" TEXT,
    "outbound_shipment_item_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_name_key" ON "ProductCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_email_key" ON "Supplier"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "StorageCell_code_key" ON "StorageCell"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CellContent_product_id_storage_cell_id_key" ON "CellContent"("product_id", "storage_cell_id");

-- CreateIndex
CREATE UNIQUE INDEX "InboundShipment_document_number_key" ON "InboundShipment"("document_number");

-- CreateIndex
CREATE UNIQUE INDEX "OutboundShipment_document_number_key" ON "OutboundShipment"("document_number");

-- CreateIndex
CREATE UNIQUE INDEX "StockMovement_inbound_shipment_item_id_key" ON "StockMovement"("inbound_shipment_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "StockMovement_outbound_shipment_item_id_key" ON "StockMovement"("outbound_shipment_item_id");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CellContent" ADD CONSTRAINT "CellContent_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CellContent" ADD CONSTRAINT "CellContent_storage_cell_id_fkey" FOREIGN KEY ("storage_cell_id") REFERENCES "StorageCell"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundShipment" ADD CONSTRAINT "InboundShipment_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundShipment" ADD CONSTRAINT "InboundShipment_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundShipmentItem" ADD CONSTRAINT "InboundShipmentItem_inbound_shipment_id_fkey" FOREIGN KEY ("inbound_shipment_id") REFERENCES "InboundShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundShipmentItem" ADD CONSTRAINT "InboundShipmentItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundShipmentItem" ADD CONSTRAINT "InboundShipmentItem_target_storage_cell_id_fkey" FOREIGN KEY ("target_storage_cell_id") REFERENCES "StorageCell"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundShipment" ADD CONSTRAINT "OutboundShipment_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundShipmentItem" ADD CONSTRAINT "OutboundShipmentItem_outbound_shipment_id_fkey" FOREIGN KEY ("outbound_shipment_id") REFERENCES "OutboundShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundShipmentItem" ADD CONSTRAINT "OutboundShipmentItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_storage_cell_id_fkey" FOREIGN KEY ("storage_cell_id") REFERENCES "StorageCell"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_inbound_shipment_item_id_fkey" FOREIGN KEY ("inbound_shipment_item_id") REFERENCES "InboundShipmentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_outbound_shipment_item_id_fkey" FOREIGN KEY ("outbound_shipment_item_id") REFERENCES "OutboundShipmentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
