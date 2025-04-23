import {Entity, model, property, belongsTo} from '@loopback/repository';
import {ColaEstados} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'cola_sincronizacion'},
    foreignKeys: {
      eduseoColaSincronizacionColaEstadosIdEstadoFkRel: {
        name: 'eduseoColaSincronizacionColaEstadosIdEstadoFkRel',
        entity: 'ColaEstados',
        entityKey: 'idEstado',
        foreignKey: 'idEstado'
      }
    }
  }
})
export class ColaSincronizacion extends Entity {
  @property({
    type: 'number',
    required: true,
    jsonSchema: {nullable: false},
    precision: 10,
    scale: 0,
    generated: false,
    id: 1,
    mysql: {columnName: 'unidad_id', dataType: 'int', dataLength: null, dataPrecision: 10, dataScale: 0, nullable: 'N', generated: false},
  })
  unidadId: number;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {nullable: false},
    length: 65535,
    generated: false,
    mysql: {columnName: 'codigo', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'N', generated: false},
  })
  codigo: string;

  @belongsTo(() => ColaEstados)
  idEstado: number;

  @property({
    type: 'date',
    required: true,
    jsonSchema: {nullable: false},
    generated: false,
    mysql: {columnName: 'fecha_accion', dataType: 'datetime', dataLength: null, dataPrecision: null, dataScale: null, nullable: 'N', generated: false},
  })
  fechaAccion: string;

  @property({
    type: 'date',
    jsonSchema: {nullable: true},
    generated: false,
    mysql: {columnName: 'created_at', dataType: 'datetime', dataLength: null, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  createdAt?: string;

  @property({
    type: 'date',
    jsonSchema: {nullable: true},
    generated: false,
    mysql: {columnName: 'updated_at', dataType: 'datetime', dataLength: null, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  updatedAt?: string;

  @property({
    type: 'date',
    jsonSchema: {nullable: true},
    generated: false,
    mysql: {columnName: 'done_at', dataType: 'datetime', dataLength: null, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  doneAt?: string;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<ColaSincronizacion>) {
    super(data);
  }
}

export interface ColaSincronizacionRelations {
  // describe navigational properties here
}

export type ColaSincronizacionWithRelations = ColaSincronizacion & ColaSincronizacionRelations;
