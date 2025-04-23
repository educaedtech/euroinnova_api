import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Metacampos,Metaobjetos,Unidades} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'unidades_metacampos_metaobjetos'},
    foreignKeys: {
      eduseoUnidadesMetacamposMetaobjetosEduseoMetacamposIdFkRel: {
        name: 'eduseoUnidadesMetacamposMetaobjetosEduseoMetacamposIdFkRel',
        entity: 'Metacampos',
        entityKey: 'id',
        foreignKey: 'metacampoId'
      },
      eduseoUnidadesMetacamposMetaobjetosEduseoMetaobjetosIdFkRel: {
        name: 'eduseoUnidadesMetacamposMetaobjetosEduseoMetaobjetosIdFkRel',
        entity: 'Metaobjetos',
        entityKey: 'id',
        foreignKey: 'metaobjetoId'
      },
      eduseoUnidadesMetacamposMetaobjetosEduseoUnidadesIdFkRel: {
        name: 'eduseoUnidadesMetacamposMetaobjetosEduseoUnidadesIdFkRel',
        entity: 'Unidades',
        entityKey: 'id',
        foreignKey: 'unidadId'
      }
    }
  }
})
export class UnidadesMetacamposMetaobjetos extends Entity {
  @belongsTo(() => Unidades)
  unidadId: number;

  @belongsTo(() => Metacampos)
  metacampoId: number;

  @belongsTo(() => Metaobjetos)
  metaobjetoId: number;

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

  constructor(data?: Partial<UnidadesMetacamposMetaobjetos>) {
    super(data);
  }
}

export interface UnidadesMetacamposMetaobjetosRelations {
  // describe navigational properties here
}

export type UnidadesMetacamposMetaobjetosWithRelations = UnidadesMetacamposMetaobjetos & UnidadesMetacamposMetaobjetosRelations;
