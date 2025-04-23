import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {NivelesEducativos, NivelesEducativosRelations} from '../models';

export class NivelesEducativosRepository extends DefaultCrudRepository<
  NivelesEducativos,
  typeof NivelesEducativos.prototype.id,
  NivelesEducativosRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(NivelesEducativos, dataSource);
  }
}
