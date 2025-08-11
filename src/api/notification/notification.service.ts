import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { successResponse } from 'src/infrastructure/responseCode/responde';
import { FilterDto } from 'src/common/dto/filter.dto';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createNotificationDto: CreateNotificationDto, userId: string) {
    try {
      const debtor = await this.prisma.debtor.findFirst({
        where: { id: createNotificationDto.debtorId },
      });
      if (!debtor) throw new BadRequestException('debtor not found');

      const notification = await this.prisma.notification.create({
        data: { ...createNotificationDto, isSended: true, sellerId: userId },
      });

      return successResponse(notification, 'Notification created', 201);
    } catch (error) {
      throw new BadRequestException(
        `Error creating notification: ${error.message}`,
      );
    }
  }

  async findAll(filter: FilterDto, debtorId?: string, userId?: string) {
    try {
      const { limit = 10, page = 1, search } = filter;
      const where: any = { sellerId: userId };

      if (search) {
        where.message = {
          contains: search,
          mode: 'insensitive',
        };
      }

      let notifications: any;

      if (debtorId) {
        notifications = await this.prisma.notification.findMany({
          where: { ...where, debtorId },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        });
      } else {
        notifications = await this.prisma.debtor.findMany({
          where: { sellerId: userId },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            Notification: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
            Phone: true
          },
        });
      }

      const total = debtorId
        ? await this.prisma.notification.count({
            where: { ...where, debtorId },
          })
        : await this.prisma.debtor.count({ where: { sellerId: userId } });

      return successResponse(notifications, 'Notifications fetched', 200, {
        total,
        page,
        limit,
      });
    } catch (error) {
      throw new BadRequestException(
        `Error fetching notifications: ${error.message}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      const notification = await this.prisma.notification.findFirst({
        where: { id },
        include: { Debtor: true, Seller: true },
      });
      if (!notification)
        throw new BadRequestException('Notification not found');

      return successResponse(notification, 'Notification fetched', 200);
    } catch (error) {
      throw new BadRequestException(
        `Error fetching notification: ${error.message}`,
      );
    }
  }

  async update(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
    userId: string,
  ) {
    try {
      const notification = await this.prisma.notification.findFirst({
        where: { id },
      });
      if (!notification)
        throw new BadRequestException('notification not found');
      if (notification.sellerId !== userId)
        throw new ForbiddenException('Access denied');

      const updated = await this.prisma.notification.update({
        where: { id },
        data: { message: updateNotificationDto.message },
      });

      return successResponse(updated, 'Notification updated', 200);
    } catch (error) {
      throw new BadRequestException(
        `Error updating notification: ${error.message}`,
      );
    }
  }

  async remove(id: string, userId: string) {
    try {
      const notification = await this.prisma.notification.findFirst({
        where: { id },
      });
      if (!notification)
        throw new BadRequestException('notification not found');
      if (notification.sellerId !== userId)
        throw new ForbiddenException('Access denied');

      await this.prisma.notification.delete({ where: { id } });

      return successResponse({}, 'Notification deleted', 200);
    } catch (error) {
      throw new BadRequestException(
        `Error deleting notification: ${error.message}`,
      );
    }
  }
}
