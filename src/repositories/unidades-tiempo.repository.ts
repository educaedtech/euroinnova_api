import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {UnidadesTiempo, UnidadesTiempoRelations} from '../models';

export class UnidadesTiempoRepository extends DefaultCrudRepository<
  UnidadesTiempo,
  typeof UnidadesTiempo.prototype.id,
  UnidadesTiempoRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(UnidadesTiempo, dataSource);
  }
}
