import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Unidades,Familias} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'unidades_familias'},
    foreignKeys: {
      unidadesFamiliasEduseoUnidadesUnidadIdFkRel: {
        name: 'unidadesFamiliasEduseoUnidadesUnidadIdFkRel',
        entity: 'Unidades',
        entityKey: 'id',
        foreignKey: 'unidadId'
      },
      unidadesFamiliasFamiliasIdFkRel: {
        name: 'unidadesFamiliasFamiliasIdFkRel',
        entity: 'Familias',
        entityKey: 'id',
        foreignKey: 'familiaId'
      }
    }
  }
})
export class UnidadesFamilias extends Entity {
  @belongsTo(() => Unidades)
  unidadId: number;

  @belongsTo(() => Familias)
  familiaId: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<UnidadesFamilias>) {
    super(data);
  }
}

export interface UnidadesFamiliasRelations {
  // describe navigational properties here
}

export type UnidadesFamiliasWithRelations = UnidadesFamilias & UnidadesFamiliasRelations;
