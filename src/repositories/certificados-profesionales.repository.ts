import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {CertificadosProfesionales, CertificadosProfesionalesRelations} from '../models';

export class CertificadosProfesionalesRepository extends DefaultCrudRepository<
  CertificadosProfesionales,
  typeof CertificadosProfesionales.prototype.id,
  CertificadosProfesionalesRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(CertificadosProfesionales, dataSource);
  }
}
