import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {InstitucionesEducativasTipos, InstitucionesEducativasTiposRelations} from '../models';

export class InstitucionesEducativasTiposRepository extends DefaultCrudRepository<
  InstitucionesEducativasTipos,
  typeof InstitucionesEducativasTipos.prototype.id,
  InstitucionesEducativasTiposRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(InstitucionesEducativasTipos, dataSource);
  }
}
