import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Titulaciones,Profesiones} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'profesiones_titulaciones'},
    foreignKeys: {
      profesionesTitulacionesIbfk_1Rel: {
        name: 'profesionesTitulacionesIbfk_1Rel',
        entity: 'Titulaciones',
        entityKey: 'id',
        foreignKey: 'titulacionId'
      },
      profesionesTitulacionesIbfk_2Rel: {
        name: 'profesionesTitulacionesIbfk_2Rel',
        entity: 'Profesiones',
        entityKey: 'id',
        foreignKey: 'profesionId'
      }
    }
  }
})
export class ProfesionesTitulaciones extends Entity {
  @belongsTo(() => Titulaciones)
  titulacionId: number;

  @belongsTo(() => Profesiones)
  profesionId: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<ProfesionesTitulaciones>) {
    super(data);
  }
}

export interface ProfesionesTitulacionesRelations {
  // describe navigational properties here
}

export type ProfesionesTitulacionesWithRelations = ProfesionesTitulaciones & ProfesionesTitulacionesRelations;
