import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {Academias, AcademiasRelations} from '../models';

export class AcademiasRepository extends DefaultCrudRepository<
  Academias,
  typeof Academias.prototype.id,
  AcademiasRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(Academias, dataSource);
  }
}
