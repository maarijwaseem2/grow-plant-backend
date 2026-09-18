import { BadRequestException, Body, Controller, Delete, Get, InternalServerErrorException, NotFoundException, Param, ParseUUIDPipe, Patch, Post, UploadedFile, UseInterceptors, UseGuards, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from './middleware/file-upload.middleware';
import { BuyPlantService } from './buy-plant.service';
import { CreateBuyPlantDto } from './dto/create-buy-plant.dto';
import { UpdateBuyPlantDto } from './dto/update-buy-plant.dto';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../shared/guards/jwt.guard';
import { AdminGuard } from '../shared/guards/admin.guard';

const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return callback(new Error('Only image files are allowed!'), false);
  }
  callback(null, true);
};

// Utility function to edit the file name
const editFileName = (req, file, callback) => {
  const name = file.originalname.split('.')[0];
  const fileExtName = '.' + file.originalname.split('.').pop();
  const randomName = Array(4)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${name}-${randomName}${fileExtName}`);
};

@Controller('plants')
export class BuyPlantController {
  constructor(private readonly buyPlantService: BuyPlantService) {}
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads', // Save files to a local directory
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async create(
    @Body() createBuyPlantDto: CreateBuyPlantDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('Received DTO:', createBuyPlantDto);
    console.log('Received File:', file);

    try {
      // Validate DTO manually if needed
      if (!createBuyPlantDto.name) {
        throw new BadRequestException('Name is required');
      }

      // Construct the public URL for the image
      const imageUrl = file
        ? `http://localhost:3000/uploads/${file.filename}` // Replace with your domain in production
        : null;

      // Prepare the plant data with image URL
      const plantData = {
        ...createBuyPlantDto,
        image: imageUrl, // Add the image URL
      };

      // Save the plant data to the database
      const result = await this.buyPlantService.create(plantData, file);

      // Return the saved data with success response
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Create Plant Error:', error);
      throw new InternalServerErrorException(error);
    }
  }

  // // // Fetch all plants
  @Get()
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return await this.buyPlantService.findAll(page, limit);
  }

  // Fetch a specific plant by ID
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.buyPlantService.findOne(id);
  }

  // Update a specific plant's data by ID
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBuyPlantDto: UpdateBuyPlantDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.buyPlantService.update(id, updateBuyPlantDto, file);
  }

  // Delete a plant entry by ID
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.buyPlantService.remove(id);
  }

  @Patch(':id/reserve')
  async reserveStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }
    const result = await this.buyPlantService.reserveStock(id, quantity);
    if (!result) {
      throw new NotFoundException('Product not found or insufficient stock');
    }
    return { message: 'Stock reserved successfully', productId: id };
  }

  @Patch(':id/release')
  async releaseStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }
    const result = await this.buyPlantService.releaseStock(id, quantity);
    if (!result) {
      throw new NotFoundException(
        'Product not found or release operation failed',
      );
    }
    return { message: 'Stock released successfully', productId: id };
  }

  @Patch(':id/purchase')
  async purchaseStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }
    const result = await this.buyPlantService.purchaseStock(id, quantity);
    if (!result) {
      throw new NotFoundException(
        'Product not found or insufficient reserved stock',
      );
    }
    return { message: 'Stock purchased successfully', productId: id };
  }
}
