// backend/src/products/products.controller.ts
import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	UseGuards,
} from '@nestjs/common'
import { UserRole } from '@prisma/client'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { ProductsService } from './products.service'
// import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

// @ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard) // Применяем Guard'ы ко всем методам контроллера по умолчанию
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // --- Создание продукта (MANAGER и WAREHOUSE_KEEPER) ---
  // @ApiOperation({ summary: 'Create a new product (MANAGER & WAREHOUSE_KEEPER)' })
  // @ApiBearerAuth()
  // @ApiBody({ type: CreateProductDto })
  // @ApiResponse({ status: HttpStatus.CREATED, description: 'Product created successfully.' })
  // ... (другие ApiResponse)
  @Post()
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER) // <--- ИЗМЕНЕНО
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  // --- Получение списка всех продуктов (MANAGER и WAREHOUSE_KEEPER) ---
  // @ApiOperation({ summary: 'Get all products (MANAGER & WAREHOUSE_KEEPER)' })
  // ...
  @Get()
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER) // Это уже было так
  async findAll() {
    return this.productsService.findAll();
  }

  // --- Получение одного продукта по ID (MANAGER и WAREHOUSE_KEEPER) ---
  // @ApiOperation({ summary: 'Get a product by ID (MANAGER & WAREHOUSE_KEEPER)' })
  // ...
  @Get(':id')
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER) // Это уже было так
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const product = await this.productsService.findOneById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found.`);
    }
    return product;
  }

  // --- Обновление продукта по ID (MANAGER и WAREHOUSE_KEEPER) ---
  // @ApiOperation({ summary: 'Update a product by ID (MANAGER & WAREHOUSE_KEEPER)' })
  // ...
  @Patch(':id')
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER) // <--- ИЗМЕНЕНО
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  // --- Удаление продукта по ID (только для MANAGER) ---
  // @ApiOperation({ summary: 'Delete a product by ID (MANAGER only)' })
  // ...
  @Delete(':id')
  @Roles(UserRole.MANAGER) // <--- ОСТАВЛЯЕМ ТОЛЬКО МЕНЕДЖЕРУ
  // Если хочешь дать права и кладовщику: @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.productsService.remove(id);
  }
}