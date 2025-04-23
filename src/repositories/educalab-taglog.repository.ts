import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {EducalabTaglog, EducalabTaglogRelations} from '../models';

export class EducalabTaglogRepository extends DefaultCrudRepository<
  EducalabTaglog,
  typeof EducalabTaglog.prototype.tag,
  EducalabTaglogRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(EducalabTaglog, dataSource);
  }
}
