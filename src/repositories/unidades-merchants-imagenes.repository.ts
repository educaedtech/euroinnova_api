import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {UnidadesMerchantsImagenes, UnidadesMerchantsImagenesRelations} from '../models';

export class UnidadesMerchantsImagenesRepository extends DefaultCrudRepository<
  UnidadesMerchantsImagenes,
  typeof UnidadesMerchantsImagenes.prototype.id,
  UnidadesMerchantsImagenesRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(UnidadesMerchantsImagenes, dataSource);
  }
}
