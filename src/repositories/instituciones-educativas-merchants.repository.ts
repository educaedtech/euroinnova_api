import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {InstitucionesEducativasMerchants, InstitucionesEducativasMerchantsRelations} from '../models';

export class InstitucionesEducativasMerchantsRepository extends DefaultCrudRepository<
  InstitucionesEducativasMerchants,
  typeof InstitucionesEducativasMerchants.prototype.id,
  InstitucionesEducativasMerchantsRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(InstitucionesEducativasMerchants, dataSource);
  }
}
