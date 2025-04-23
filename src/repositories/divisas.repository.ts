import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {Divisas, DivisasRelations} from '../models';

export class DivisasRepository extends DefaultCrudRepository<
  Divisas,
  typeof Divisas.prototype.id,
  DivisasRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(Divisas, dataSource);
  }
}
