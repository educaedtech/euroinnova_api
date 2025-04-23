import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {Profesiones, ProfesionesRelations} from '../models';

export class ProfesionesRepository extends DefaultCrudRepository<
  Profesiones,
  typeof Profesiones.prototype.id,
  ProfesionesRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(Profesiones, dataSource);
  }
}
