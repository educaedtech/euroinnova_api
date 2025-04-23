import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {UnidadesRelacionesTipos, UnidadesRelacionesTiposRelations} from '../models';

export class UnidadesRelacionesTiposRepository extends DefaultCrudRepository<
  UnidadesRelacionesTipos,
  typeof UnidadesRelacionesTipos.prototype.id,
  UnidadesRelacionesTiposRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(UnidadesRelacionesTipos, dataSource);
  }
}
