import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {CreditosProductos, CreditosProductosRelations} from '../models';

export class CreditosProductosRepository extends DefaultCrudRepository<
  CreditosProductos,
  typeof CreditosProductos.prototype.id,
  CreditosProductosRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(CreditosProductos, dataSource);
  }
}
