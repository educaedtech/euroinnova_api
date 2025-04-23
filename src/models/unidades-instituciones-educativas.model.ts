import {Entity, model, property, belongsTo} from '@loopback/repository';
import {InstitucionesEducativas,Unidades} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'unidades_instituciones_educativas'},
    foreignKeys: {
      eduseoUnidadesInstitucionesRel: {
        name: 'eduseoUnidadesInstitucionesRel',
        entity: 'InstitucionesEducativas',
        entityKey: 'id',
        foreignKey: 'institucionEducativaId'
      },
      eduseoUnidadesInstitucionesEducativasEduseoUnidadesIdFkRel: {
        name: 'eduseoUnidadesInstitucionesEducativasEduseoUnidadesIdFkRel',
        entity: 'Unidades',
        entityKey: 'id',
        foreignKey: 'unidadId'
      }
    }
  }
})
export class UnidadesInstitucionesEducativas extends Entity {
  @belongsTo(() => Unidades)
  unidadId: number;

  @belongsTo(() => InstitucionesEducativas)
  institucionEducativaId: number;

  @property({
    type: 'number',
    jsonSchema: {nullable: true},
    precision: 3,
    scale: 0,
    generated: false,
    mysql: {columnName: 'propietaria', dataType: 'tinyint', dataLength: null, dataPrecision: 3, dataScale: 0, nullable: 'Y', generated: false},
  })
  propietaria?: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<UnidadesInstitucionesEducativas>) {
    super(data);
  }
}

export interface UnidadesInstitucionesEducativasRelations {
  // describe navigational properties here
}

export type UnidadesInstitucionesEducativasWithRelations = UnidadesInstitucionesEducativas & UnidadesInstitucionesEducativasRelations;
