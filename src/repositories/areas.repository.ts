import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {Areas, AreasRelations} from '../models';

export class AreasRepository extends DefaultCrudRepository<
  Areas,
  typeof Areas.prototype.id,
  AreasRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(Areas, dataSource);
  }
}
