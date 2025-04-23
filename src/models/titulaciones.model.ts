import {Entity, model, property, belongsTo} from '@loopback/repository';
import {TitulacionesTipos} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'titulaciones'},
    foreignKeys: {
      titulacionesIbfk_1Rel: {
        name: 'titulacionesIbfk_1Rel',
        entity: 'TitulacionesTipos',
        entityKey: 'id',
        foreignKey: 'tipoId'
      }
    }
  }
})
export class Titulaciones extends Entity {
  @property({
    type: 'number',
    jsonSchema: {nullable: false},
    precision: 10,
    scale: 0,
    generated: 1,
    id: 1,
    mysql: {columnName: 'id', dataType: 'int', dataLength: null, dataPrecision: 10, dataScale: 0, nullable: 'N', generated: 1},
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {nullable: false},
    length: 255,
    generated: false,
    mysql: {columnName: 'nombre', dataType: 'varchar', dataLength: 255, dataPrecision: null, dataScale: null, nullable: 'N', generated: false},
  })
  nombre: string;

  @belongsTo(() => TitulacionesTipos)
  tipoId?: number;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'descripcion', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  descripcion?: string;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Titulaciones>) {
    super(data);
  }
}

export interface TitulacionesRelations {
  // describe navigational properties here
}

export type TitulacionesWithRelations = Titulaciones & TitulacionesRelations;
