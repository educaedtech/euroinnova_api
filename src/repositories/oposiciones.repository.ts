import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {Oposiciones, OposicionesRelations} from '../models';

export class OposicionesRepository extends DefaultCrudRepository<
  Oposiciones,
  typeof Oposiciones.prototype.id,
  OposicionesRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(Oposiciones, dataSource);
  }
}
