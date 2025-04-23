import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {PalabrasClave, PalabrasClaveRelations} from '../models';

export class PalabrasClaveRepository extends DefaultCrudRepository<
  PalabrasClave,
  typeof PalabrasClave.prototype.id,
  PalabrasClaveRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(PalabrasClave, dataSource);
  }
}
