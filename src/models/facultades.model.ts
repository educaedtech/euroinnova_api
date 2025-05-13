/* eslint-disable @typescript-eslint/naming-convention */
import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'facultades'},
    foreignKeys: {
      eduseoFacultadesEduseoPlataformasOnlineIdFkRel: {
        name: 'eduseoFacultadesEduseoPlataformasOnlineIdFkRel',
        entity: 'PlataformasOnline',
        entityKey: 'id',
        foreignKey: 'plataforma_defecto_id'
      },
      facultadesIbfk_1Rel: {
        name: 'facultadesIbfk_1Rel',
        entity: 'Areas',
        entityKey: 'id',
        foreignKey: 'area_id'
      }
    }
  }
})
export class Facultades extends Entity {
  @property({
    type: 'number',
    jsonSchema: {nullable: false},
    precision: 5,
    scale: 0,
    generated: 1,
    id: 1,
    mysql: {columnName: 'id', dataType: 'smallint', dataLength: null, dataPrecision: 5, dataScale: 0, nullable: 'N', generated: 1},
  })
  id?: number;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 255,
    generated: false,
    mysql: {columnName: 'nombre', dataType: 'varchar', dataLength: 255, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  nombre?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 255,
    generated: false,
    mysql: {columnName: 'logo', dataType: 'varchar', dataLength: 255, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  logo?: string;

  @property({
    type: 'number',
    required: true,
    jsonSchema: {nullable: false},
    precision: 3,
    scale: 0,
    generated: false,
    mysql: {columnName: 'activo', dataType: 'tinyint', dataLength: null, dataPrecision: 3, dataScale: 0, nullable: 'N', generated: false},
  })
  activo: number;

  // @belongsTo(() => Areas, {
  //   keyFrom: 'areaId',    // nombre de la propiedad en el modelo
  //   name: 'area_id',      // nombre de la columna en la BD
  //   keyTo: 'id'           // columna a la que referencia en la tabla Areas
  // })
  // areaId?: number;

  // @belongsTo(() => PlataformasOnline, {name: 'plataforma_defecto_id'})
  // plataformaDefectoId?: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Facultades>) {
    super(data);
  }
}

export interface FacultadesRelations {
  // describe navigational properties here
}

export type FacultadesWithRelations = Facultades & FacultadesRelations;
