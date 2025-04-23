import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {TitulacionesTipos, TitulacionesTiposRelations} from '../models';

export class TitulacionesTiposRepository extends DefaultCrudRepository<
  TitulacionesTipos,
  typeof TitulacionesTipos.prototype.id,
  TitulacionesTiposRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(TitulacionesTipos, dataSource);
  }
}
