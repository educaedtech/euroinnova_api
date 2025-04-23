import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {InstitucionesEducativas, InstitucionesEducativasRelations} from '../models';

export class InstitucionesEducativasRepository extends DefaultCrudRepository<
  InstitucionesEducativas,
  typeof InstitucionesEducativas.prototype.id,
  InstitucionesEducativasRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(InstitucionesEducativas, dataSource);
  }
}
