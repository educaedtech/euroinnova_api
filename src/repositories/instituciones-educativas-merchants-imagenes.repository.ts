import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {InstitucionesEducativasMerchantsImagenes, InstitucionesEducativasMerchantsImagenesRelations} from '../models';

export class InstitucionesEducativasMerchantsImagenesRepository extends DefaultCrudRepository<
  InstitucionesEducativasMerchantsImagenes,
  typeof InstitucionesEducativasMerchantsImagenes.prototype.id,
  InstitucionesEducativasMerchantsImagenesRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(InstitucionesEducativasMerchantsImagenes, dataSource);
  }
}
