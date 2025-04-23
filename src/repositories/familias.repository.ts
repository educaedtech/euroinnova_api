import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {Familias, FamiliasRelations} from '../models';

export class FamiliasRepository extends DefaultCrudRepository<
  Familias,
  typeof Familias.prototype.id,
  FamiliasRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(Familias, dataSource);
  }
}
