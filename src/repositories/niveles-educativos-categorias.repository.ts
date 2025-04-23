import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {NivelesEducativosCategorias, NivelesEducativosCategoriasRelations} from '../models';

export class NivelesEducativosCategoriasRepository extends DefaultCrudRepository<
  NivelesEducativosCategorias,
  typeof NivelesEducativosCategorias.prototype.id,
  NivelesEducativosCategoriasRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(NivelesEducativosCategorias, dataSource);
  }
}
