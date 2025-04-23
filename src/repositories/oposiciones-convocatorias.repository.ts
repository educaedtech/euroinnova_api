import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {OposicionesConvocatorias, OposicionesConvocatoriasRelations} from '../models';

export class OposicionesConvocatoriasRepository extends DefaultCrudRepository<
  OposicionesConvocatorias,
  typeof OposicionesConvocatorias.prototype.id,
  OposicionesConvocatoriasRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(OposicionesConvocatorias, dataSource);
  }
}
