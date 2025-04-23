import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {ColaSincronizacion, ColaSincronizacionRelations} from '../models';

export class ColaSincronizacionRepository extends DefaultCrudRepository<
  ColaSincronizacion,
  typeof ColaSincronizacion.prototype.unidadId,
  ColaSincronizacionRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(ColaSincronizacion, dataSource);
  }
}
