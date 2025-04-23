import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Metacampos,Unidades} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'unidades_metacampos'},
    foreignKeys: {
      eduseoUnidadesMetacamposEduseoMetacamposIdFkRel: {
        name: 'eduseoUnidadesMetacamposEduseoMetacamposIdFkRel',
        entity: 'Metacampos',
        entityKey: 'id',
        foreignKey: 'metacampoId'
      },
      eduseoUnidadesMetacamposEduseoUnidadesIdFkRel: {
        name: 'eduseoUnidadesMetacamposEduseoUnidadesIdFkRel',
        entity: 'Unidades',
        entityKey: 'id',
        foreignKey: 'unidadId'
      }
    }
  }
})
export class UnidadesMetacampos extends Entity {
  @belongsTo(() => Unidades)
  unidadId: number;

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

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<UnidadesMetacampos>) {
    super(data);
  }
}

export interface UnidadesMetacamposRelations {
  // describe navigational properties here
}

export type UnidadesMetacamposWithRelations = UnidadesMetacampos & UnidadesMetacamposRelations;
