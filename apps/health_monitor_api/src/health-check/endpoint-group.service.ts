import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EndpointGroup } from './schemas/endpoint-group.schema';
import { CreateEndpointGroupDto } from './dto/create-endpoint-group.dto';
import { UpdateEndpointGroupDto } from './dto/update-endpoint-group.dto';

@Injectable()
export class EndpointGroupService {
  constructor(
    @InjectModel(EndpointGroup.name) private endpointGroupModel: Model<EndpointGroup>,
  ) {}

  async create(createEndpointGroupDto: CreateEndpointGroupDto): Promise<EndpointGroup> {
    // Get the highest sortOrder to append at the end
    const highestSort = await this.endpointGroupModel.findOne().sort({ sortOrder: -1 }).exec();
    const nextSortOrder = (highestSort?.sortOrder || -1) + 1;

    const newGroup = new this.endpointGroupModel({
      ...createEndpointGroupDto,
      sortOrder: nextSortOrder,
    });
    return newGroup.save();
  }

  async findAll(): Promise<EndpointGroup[]> {
    return this.endpointGroupModel.find().sort({ sortOrder: 1 }).exec();
  }

  async findById(id: string): Promise<EndpointGroup | null> {
    return this.endpointGroupModel.findById(id).exec();
  }

  async update(id: string, updateEndpointGroupDto: UpdateEndpointGroupDto): Promise<EndpointGroup | null> {
    return this.endpointGroupModel
      .findByIdAndUpdate(id, updateEndpointGroupDto, { new: true })
      .exec();
  }

  async delete(id: string): Promise<EndpointGroup | null> {
    return this.endpointGroupModel.findByIdAndDelete(id).exec();
  }

  async toggleActive(id: string): Promise<EndpointGroup> {
    const group = await this.endpointGroupModel.findById(id).exec();
    if (!group) throw new Error('Group not found');
    group.active = !group.active;
    return group.save();
  }

  async reorderGroups(groups: { id: string; sortOrder: number }[]): Promise<EndpointGroup[]> {
    const updated = await Promise.all(
      groups.map((group) =>
        this.endpointGroupModel
          .findByIdAndUpdate(group.id, { sortOrder: group.sortOrder }, { new: true })
          .exec(),
      ),
    );
    return updated.filter((item) => item !== null) as EndpointGroup[];
  }
}
