import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {NivelesEducativosMetacamposValores, NivelesEducativosMetacamposValoresRelations} from '../models';

export class NivelesEducativosMetacamposValoresRepository extends DefaultCrudRepository<
  NivelesEducativosMetacamposValores,
  typeof NivelesEducativosMetacamposValores.prototype.id,
  NivelesEducativosMetacamposValoresRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(NivelesEducativosMetacamposValores, dataSource);
  }
}
