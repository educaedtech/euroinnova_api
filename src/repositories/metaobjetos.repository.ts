import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {Metaobjetos, MetaobjetosRelations} from '../models';

export class MetaobjetosRepository extends DefaultCrudRepository<
  Metaobjetos,
  typeof Metaobjetos.prototype.id,
  MetaobjetosRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(Metaobjetos, dataSource);
  }
}
