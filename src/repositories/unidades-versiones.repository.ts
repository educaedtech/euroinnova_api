import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {UnidadesVersiones, UnidadesVersionesRelations} from '../models';

export class UnidadesVersionesRepository extends DefaultCrudRepository<
  UnidadesVersiones,
  typeof UnidadesVersiones.prototype.id,
  UnidadesVersionesRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(UnidadesVersiones, dataSource);
  }
}
