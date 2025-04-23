import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {Escuelas, EscuelasRelations} from '../models';

export class EscuelasRepository extends DefaultCrudRepository<
  Escuelas,
  typeof Escuelas.prototype.id,
  EscuelasRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(Escuelas, dataSource);
  }
}
