import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  ConsoleLogger,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AdminGuard } from 'src/shared/guards/admin.guard';
import { JwtAuthGuard } from 'src/shared/guards/jwt.guard';
import { GardenerGuard } from 'src/shared/guards/gardener.guard';

const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return callback(new Error('Only image files are allowed!'), false);
  }
  callback(null, true);
};

const editFileName = (req, file, callback) => {
  const name = file.originalname.split('.')[0];
  const fileExtName = '.' + file.originalname.split('.').pop();
  const randomName = Array(4)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${name}-${randomName}${fileExtName}`);
};

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async create(
    @Body() createServiceDto: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Debug log incoming data
    console.log('Raw request body:', createServiceDto);
    console.log('File received:', file ? file.filename : 'No file');

    // Handle plants data which could be JSON string
    try {
      if (typeof createServiceDto.plants === 'string') {
        createServiceDto.plants = JSON.parse(createServiceDto.plants);
      }

      // Convert form data type values to appropriate types
      createServiceDto.total = Number(createServiceDto.total);
      createServiceDto.latitude = Number(createServiceDto.latitude);
      createServiceDto.longitude = Number(createServiceDto.longitude);
      createServiceDto.isSubscription =
        createServiceDto.isSubscription === 'true' ||
        createServiceDto.isSubscription === true;

      if (createServiceDto.subscriptionMonths) {
        createServiceDto.subscriptionMonths = Number(
          createServiceDto.subscriptionMonths,
        );
      }

      console.log('Processed data:', createServiceDto);
      return this.servicesService.create(createServiceDto, file);
    } catch (error) {
      console.error('Error in controller:', error);
      throw error;
    }
  }

  @Get()
  findAll() {
    return this.servicesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  getMine(@Request() req) {
    return this.servicesService.getMyServices(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.remove(id);
  }

  // ----------- NEW: ADMIN ASSIGN GARDENER -----------
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('assign-gardener/:serviceId')
  async assignGardener(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Body('gardenerId') gardenerId: string,
  ) {
    return this.servicesService.assignGardener(serviceId, gardenerId);
  }

  @UseGuards(JwtAuthGuard, GardenerGuard)
  @Get('gardener/tasks')
  async getGardenerTasks(@Request() req) {
    return this.servicesService.getGardenerTasks(req.user.id);
  }

  @UseGuards(JwtAuthGuard, GardenerGuard)
  @Patch('gardener/tasks/:id/status')
  async updateTaskStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
    @Request() req,
  ) {
    return this.servicesService.updateTaskStatus(id, req.user.id, status);
  }
}
