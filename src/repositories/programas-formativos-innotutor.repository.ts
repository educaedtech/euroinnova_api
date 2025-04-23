import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {EuroProductosDataSource} from '../datasources';
import {ProgramasFormativosInnotutor, ProgramasFormativosInnotutorRelations} from '../models';

export class ProgramasFormativosInnotutorRepository extends DefaultCrudRepository<
  ProgramasFormativosInnotutor,
  typeof ProgramasFormativosInnotutor.prototype.id,
  ProgramasFormativosInnotutorRelations
> {
  constructor(
    @inject('datasources.euroProductos') dataSource: EuroProductosDataSource,
  ) {
    super(ProgramasFormativosInnotutor, dataSource);
  }
}
