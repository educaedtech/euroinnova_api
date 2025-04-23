import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Unidades,Etiquetas} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'unidades_etiquetas'},
    foreignKeys: {
      unidadesEtiquetasIbfk_1Rel: {
        name: 'unidadesEtiquetasIbfk_1Rel',
        entity: 'Unidades',
        entityKey: 'id',
        foreignKey: 'unidadId'
      },
      unidadesEtiquetasIbfk_2Rel: {
        name: 'unidadesEtiquetasIbfk_2Rel',
        entity: 'Etiquetas',
        entityKey: 'id',
        foreignKey: 'etiquetaId'
      }
    }
  }
})
export class UnidadesEtiquetas extends Entity {
  @belongsTo(() => Unidades)
  unidadId: number;

  @belongsTo(() => Etiquetas)
  etiquetaId: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<UnidadesEtiquetas>) {
    super(data);
  }
}

export interface UnidadesEtiquetasRelations {
  // describe navigational properties here
}

export type UnidadesEtiquetasWithRelations = UnidadesEtiquetas & UnidadesEtiquetasRelations;
