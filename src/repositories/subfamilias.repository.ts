import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {Subfamilias, SubfamiliasRelations} from '../models';

export class SubfamiliasRepository extends DefaultCrudRepository<
  Subfamilias,
  typeof Subfamilias.prototype.id,
  SubfamiliasRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(Subfamilias, dataSource);
  }
}
