import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {MetacamposMetaobjetos, MetacamposMetaobjetosRelations} from '../models';

export class MetacamposMetaobjetosRepository extends DefaultCrudRepository<
  MetacamposMetaobjetos,
  typeof MetacamposMetaobjetos.prototype.metacampoId,
  MetacamposMetaobjetosRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(MetacamposMetaobjetos, dataSource);
  }
}
