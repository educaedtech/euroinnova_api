import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Subfamilias,Unidades} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'unidades_subfamilias'},
    foreignKeys: {
      unidadesSubfamiliasSubfamiliasIdFkRel: {
        name: 'unidadesSubfamiliasSubfamiliasIdFkRel',
        entity: 'Subfamilias',
        entityKey: 'id',
        foreignKey: 'subfamiliaId'
      },
      unidadesSubfamiliasUnidadesIdFkRel: {
        name: 'unidadesSubfamiliasUnidadesIdFkRel',
        entity: 'Unidades',
        entityKey: 'id',
        foreignKey: 'unidadId'
      }
    }
  }
})
export class UnidadesSubfamilias extends Entity {
  @belongsTo(() => Unidades)
  unidadId: number;

  @belongsTo(() => Subfamilias)
  subfamiliaId: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<UnidadesSubfamilias>) {
    super(data);
  }
}

export interface UnidadesSubfamiliasRelations {
  // describe navigational properties here
}

export type UnidadesSubfamiliasWithRelations = UnidadesSubfamilias & UnidadesSubfamiliasRelations;
