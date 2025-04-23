import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {Preguntas, PreguntasRelations} from '../models';

export class PreguntasRepository extends DefaultCrudRepository<
  Preguntas,
  typeof Preguntas.prototype.id,
  PreguntasRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(Preguntas, dataSource);
  }
}
