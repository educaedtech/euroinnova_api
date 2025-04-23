import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {Unidades, UnidadesRelations} from '../models';

export class UnidadesRepository extends DefaultCrudRepository<
  Unidades,
  typeof Unidades.prototype.id,
  UnidadesRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(Unidades, dataSource);
  }
}
