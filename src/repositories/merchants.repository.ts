import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {Merchants, MerchantsRelations} from '../models';

export class MerchantsRepository extends DefaultCrudRepository<
  Merchants,
  typeof Merchants.prototype.id,
  MerchantsRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(Merchants, dataSource);
  }
}
