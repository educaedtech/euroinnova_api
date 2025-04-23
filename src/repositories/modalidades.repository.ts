import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {Modalidades, ModalidadesRelations} from '../models';

export class ModalidadesRepository extends DefaultCrudRepository<
  Modalidades,
  typeof Modalidades.prototype.id,
  ModalidadesRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(Modalidades, dataSource);
  }
}
