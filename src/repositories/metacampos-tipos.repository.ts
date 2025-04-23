import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {MetacamposTipos, MetacamposTiposRelations} from '../models';

export class MetacamposTiposRepository extends DefaultCrudRepository<
  MetacamposTipos,
  typeof MetacamposTipos.prototype.id,
  MetacamposTiposRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(MetacamposTipos, dataSource);
  }
}
