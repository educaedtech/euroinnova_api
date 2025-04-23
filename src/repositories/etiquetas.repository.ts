import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {Etiquetas, EtiquetasRelations} from '../models';

export class EtiquetasRepository extends DefaultCrudRepository<
  Etiquetas,
  typeof Etiquetas.prototype.id,
  EtiquetasRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(Etiquetas, dataSource);
  }
}
