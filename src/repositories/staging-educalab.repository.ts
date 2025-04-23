import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {StagingEducalab, StagingEducalabRelations} from '../models';

export class StagingEducalabRepository extends DefaultCrudRepository<
  StagingEducalab,
  typeof StagingEducalab.prototype.repoId,
  StagingEducalabRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(StagingEducalab, dataSource);
  }
}
