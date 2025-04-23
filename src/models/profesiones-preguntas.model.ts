import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Profesiones,Oposiciones} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'profesiones_preguntas'},
    foreignKeys: {
      profesionesPreguntasIbfk_1Rel: {
        name: 'profesionesPreguntasIbfk_1Rel',
        entity: 'Profesiones',
        entityKey: 'id',
        foreignKey: 'profesionId'
      },
      profesionesPreguntasIbfk_2Rel: {
        name: 'profesionesPreguntasIbfk_2Rel',
        entity: 'Oposiciones',
        entityKey: 'id',
        foreignKey: 'oposicionId'
      }
    }
  }
})
export class ProfesionesPreguntas extends Entity {
  @belongsTo(() => Profesiones)
  profesionId: number;

  @belongsTo(() => Oposiciones)
  oposicionId: number;

  @property({
    type: 'number',
    jsonSchema: {nullable: true},
    precision: 10,
    scale: 0,
    generated: false,
    mysql: {columnName: 'peso', dataType: 'decimal', dataLength: null, dataPrecision: 10, dataScale: 0, nullable: 'Y', generated: false},
  })
  peso?: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<ProfesionesPreguntas>) {
    super(data);
  }
}

export interface ProfesionesPreguntasRelations {
  // describe navigational properties here
}

export type ProfesionesPreguntasWithRelations = ProfesionesPreguntas & ProfesionesPreguntasRelations;
