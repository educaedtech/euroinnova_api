import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {Metodologias, MetodologiasRelations} from '../models';

export class MetodologiasRepository extends DefaultCrudRepository<
  Metodologias,
  typeof Metodologias.prototype.id,
  MetodologiasRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(Metodologias, dataSource);
  }
}
