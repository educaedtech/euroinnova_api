import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {Metacampos, MetacamposRelations} from '../models';

export class MetacamposRepository extends DefaultCrudRepository<
  Metacampos,
  typeof Metacampos.prototype.id,
  MetacamposRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(Metacampos, dataSource);
  }
}
