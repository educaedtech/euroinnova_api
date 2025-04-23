import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {ColaEstados, ColaEstadosRelations} from '../models';

export class ColaEstadosRepository extends DefaultCrudRepository<
  ColaEstados,
  typeof ColaEstados.prototype.idEstado,
  ColaEstadosRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(ColaEstados, dataSource);
  }
}
