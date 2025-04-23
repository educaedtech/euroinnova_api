import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {Idiomas, IdiomasRelations} from '../models';

export class IdiomasRepository extends DefaultCrudRepository<
  Idiomas,
  typeof Idiomas.prototype.id,
  IdiomasRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(Idiomas, dataSource);
  }
}
