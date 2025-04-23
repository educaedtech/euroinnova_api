import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {ImagenesTipos, ImagenesTiposRelations} from '../models';

export class ImagenesTiposRepository extends DefaultCrudRepository<
  ImagenesTipos,
  typeof ImagenesTipos.prototype.id,
  ImagenesTiposRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(ImagenesTipos, dataSource);
  }
}
