import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {Titulaciones, TitulacionesRelations} from '../models';

export class TitulacionesRepository extends DefaultCrudRepository<
  Titulaciones,
  typeof Titulaciones.prototype.id,
  TitulacionesRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(Titulaciones, dataSource);
  }
}
