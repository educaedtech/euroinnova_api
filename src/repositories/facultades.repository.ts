import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {Facultades, FacultadesRelations} from '../models';

export class FacultadesRepository extends DefaultCrudRepository<
  Facultades,
  typeof Facultades.prototype.id,
  FacultadesRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(Facultades, dataSource);
  }
}
