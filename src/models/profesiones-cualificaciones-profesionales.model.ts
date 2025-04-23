import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Profesiones,CualificacionesProfesionales} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'profesiones_cualificaciones_profesionales'},
    foreignKeys: {
      profesionesCualificacionesProfesionalesIbfk_1Rel: {
        name: 'profesionesCualificacionesProfesionalesIbfk_1Rel',
        entity: 'Profesiones',
        entityKey: 'id',
        foreignKey: 'profesionId'
      },
      profesionesCualificacionesProfesionalesIbfk_2Rel: {
        name: 'profesionesCualificacionesProfesionalesIbfk_2Rel',
        entity: 'CualificacionesProfesionales',
        entityKey: 'id',
        foreignKey: 'cualificacionProfesionalId'
      }
    }
  }
})
export class ProfesionesCualificacionesProfesionales extends Entity {
  @belongsTo(() => Profesiones)
  profesionId: number;

  @belongsTo(() => CualificacionesProfesionales)
  cualificacionProfesionalId: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<ProfesionesCualificacionesProfesionales>) {
    super(data);
  }
}

export interface ProfesionesCualificacionesProfesionalesRelations {
  // describe navigational properties here
}

export type ProfesionesCualificacionesProfesionalesWithRelations = ProfesionesCualificacionesProfesionales & ProfesionesCualificacionesProfesionalesRelations;
