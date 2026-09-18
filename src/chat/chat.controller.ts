import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post('send')
  send(
    @Body() dto: { toUserId: string; type?: string; content: string },
    @Request() req,
  ) {
    return this.chat.sendMessage(req.user.id, req.user.role, dto);
  }

  @Get('conversations')
  conversations(@Request() req) {
    return this.chat.getMyConversations(req.user.id, req.user.role);
  }

  @Get('with/:otherId')
  conversation(@Param('otherId') otherId: string, @Request() req) {
    return this.chat.getConversation(req.user.id, otherId);
  }
}
