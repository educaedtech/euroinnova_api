import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Metacampos,NivelesEducativos} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'niveles_educativos_metacampos_valores'},
    foreignKeys: {
      eduseoMetacamposFkRel: {
        name: 'eduseoMetacamposFkRel',
        entity: 'Metacampos',
        entityKey: 'id',
        foreignKey: 'metacampoId'
      },
      eduseoNivelesEducativosFkRel: {
        name: 'eduseoNivelesEducativosFkRel',
        entity: 'NivelesEducativos',
        entityKey: 'id',
        foreignKey: 'nivelEducativoId'
      }
    }
  }
})
export class NivelesEducativosMetacamposValores extends Entity {
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

  @belongsTo(() => NivelesEducativos)
  nivelEducativoId: number;

  @belongsTo(() => Metacampos)
  metacampoId: number;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'valor', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  valor?: string;

  @property({
    type: 'number',
    jsonSchema: {nullable: true},
    precision: 3,
    scale: 0,
    generated: false,
    mysql: {columnName: 'activo', dataType: 'tinyint', dataLength: null, dataPrecision: 3, dataScale: 0, nullable: 'Y', generated: false},
  })
  activo?: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<NivelesEducativosMetacamposValores>) {
    super(data);
  }
}

export interface NivelesEducativosMetacamposValoresRelations {
  // describe navigational properties here
}

export type NivelesEducativosMetacamposValoresWithRelations = NivelesEducativosMetacamposValores & NivelesEducativosMetacamposValoresRelations;
