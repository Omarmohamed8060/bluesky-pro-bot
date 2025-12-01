import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto, UpdateTemplateDto, TemplateType } from './dto/create-template.dto';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(type?: TemplateType) {
    const where = type ? { type } : {};
    return this.prisma.template.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const result = await this.prisma.template.findUnique({
      where: { id },
    });

    if (!result) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return result;
  }

  async create(createTemplateDto: CreateTemplateDto) {
    return this.prisma.template.create({
      data: {
        name: createTemplateDto.name,
        type: createTemplateDto.type as any,
        body: createTemplateDto.body,
      },
    });
  }

  async update(id: string, updateTemplateDto: UpdateTemplateDto) {
    await this.findOne(id);

    const updateData: any = {};
    if (updateTemplateDto.name) updateData.name = updateTemplateDto.name;
    if (updateTemplateDto.type) updateData.type = updateTemplateDto.type as any;
    if (updateTemplateDto.body) updateData.body = updateTemplateDto.body;

    return this.prisma.template.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.template.delete({
      where: { id },
    });
  }

  async renderTemplate(templateId: string, variables: Record<string, string>): Promise<string> {
    const template = await this.findOne(templateId);
    
    let rendered = template.body;
    
    // Replace variables like {{username}}, {{link}}, etc.
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, value);
    }
    
    return rendered;
  }
}
