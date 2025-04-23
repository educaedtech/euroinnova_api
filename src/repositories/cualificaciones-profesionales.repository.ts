import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {CualificacionesProfesionales, CualificacionesProfesionalesRelations} from '../models';

export class CualificacionesProfesionalesRepository extends DefaultCrudRepository<
  CualificacionesProfesionales,
  typeof CualificacionesProfesionales.prototype.id,
  CualificacionesProfesionalesRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(CualificacionesProfesionales, dataSource);
  }
}
