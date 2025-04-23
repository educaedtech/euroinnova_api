import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {Sectores, SectoresRelations} from '../models';

export class SectoresRepository extends DefaultCrudRepository<
  Sectores,
  typeof Sectores.prototype.id,
  SectoresRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(Sectores, dataSource);
  }
}
