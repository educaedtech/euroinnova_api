import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {PlataformasOnline, PlataformasOnlineRelations} from '../models';

export class PlataformasOnlineRepository extends DefaultCrudRepository<
  PlataformasOnline,
  typeof PlataformasOnline.prototype.id,
  PlataformasOnlineRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(PlataformasOnline, dataSource);
  }
}
