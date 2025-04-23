import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {Empresas, EmpresasRelations} from '../models';

export class EmpresasRepository extends DefaultCrudRepository<
  Empresas,
  typeof Empresas.prototype.id,
  EmpresasRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(Empresas, dataSource);
  }
}
