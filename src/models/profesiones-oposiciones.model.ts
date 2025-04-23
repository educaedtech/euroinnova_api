import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Profesiones,Oposiciones} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'profesiones_oposiciones'},
    foreignKeys: {
      profesionesOposicionesIbfk_1Rel: {
        name: 'profesionesOposicionesIbfk_1Rel',
        entity: 'Profesiones',
        entityKey: 'id',
        foreignKey: 'profesionId'
      },
      profesionesOposicionesIbfk_2Rel: {
        name: 'profesionesOposicionesIbfk_2Rel',
        entity: 'Oposiciones',
        entityKey: 'id',
        foreignKey: 'oposicionId'
      }
    }
  }
})
export class ProfesionesOposiciones extends Entity {
  @belongsTo(() => Profesiones)
  profesionId: number;

  @belongsTo(() => Oposiciones)
  oposicionId: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<ProfesionesOposiciones>) {
    super(data);
  }
}

export interface ProfesionesOposicionesRelations {
  // describe navigational properties here
}

export type ProfesionesOposicionesWithRelations = ProfesionesOposiciones & ProfesionesOposicionesRelations;
