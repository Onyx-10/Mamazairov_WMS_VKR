import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { UserRole } from '@prisma/client'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { SearchService } from './search.service'

@Controller('search')
@UseGuards(JwtAuthGuard, RolesGuard) // Защищаем поиск
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER) // Доступен обеим ролям
  async search(@Query('term') term: string) {
    return this.searchService.globalSearch(term);
  }
}
