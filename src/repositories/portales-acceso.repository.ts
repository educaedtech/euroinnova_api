import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {PortalesAcceso, PortalesAccesoRelations} from '../models';

export class PortalesAccesoRepository extends DefaultCrudRepository<
  PortalesAcceso,
  typeof PortalesAcceso.prototype.id,
  PortalesAccesoRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(PortalesAcceso, dataSource);
  }
}
