import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  InternalServerErrorException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ComplainService } from './complain.service';
import { CreateComplainDto } from './dto/create-complain.dto';
import { UpdateComplainDto } from './dto/update-complain.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { multerOptions } from './middleware/file-upload.middleware';

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

@Controller('complain')
export class ComplainController {
  constructor(private readonly complainService: ComplainService) {}
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
    @Body() createComplainDto: CreateComplainDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
      return await this.complainService.create(createComplainDto, file);
  }

  @Get()
  async findAll() {
    return await this.complainService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.complainService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateComplainDto: UpdateComplainDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.complainService.update(id, updateComplainDto, file);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.complainService.remove(id);
  }
}
