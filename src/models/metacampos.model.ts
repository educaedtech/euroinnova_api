import {Entity, model, property, belongsTo} from '@loopback/repository';
import {MetacamposTipos} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'metacampos'},
    foreignKeys: {
      eduseoMetacamposEduseoMetacamposTiposIdFkRel: {
        name: 'eduseoMetacamposEduseoMetacamposTiposIdFkRel',
        entity: 'MetacamposTipos',
        entityKey: 'id',
        foreignKey: 'tipoId'
      }
    }
  }
})
export class Metacampos extends Entity {
  @property({
    type: 'number',
    required: true,
    jsonSchema: {nullable: false},
    precision: 10,
    scale: 0,
    generated: false,
    id: 1,
    mysql: {columnName: 'id', dataType: 'int', dataLength: null, dataPrecision: 10, dataScale: 0, nullable: 'N', generated: false},
  })
  id: number;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'nombre', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  nombre?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'descripcion', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  descripcion?: string;

  @belongsTo(() => MetacamposTipos)
  tipoId?: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Metacampos>) {
    super(data);
  }
}

export interface MetacamposRelations {
  // describe navigational properties here
}

export type MetacamposWithRelations = Metacampos & MetacamposRelations;
