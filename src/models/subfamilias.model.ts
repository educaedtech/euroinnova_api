import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Familias} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'subfamilias'},
    foreignKeys: {
      eduseoSubfamiliasEduseoFamiliaIdFkRel: {
        name: 'eduseoSubfamiliasEduseoFamiliaIdFkRel',
        entity: 'Familias',
        entityKey: 'id',
        foreignKey: 'familiaId'
      }
    }
  }
})
export class Subfamilias extends Entity {
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
    type: 'number',
    jsonSchema: {nullable: true},
    precision: 10,
    scale: 0,
    generated: false,
    mysql: {columnName: 'nombre', dataType: 'int', dataLength: null, dataPrecision: 10, dataScale: 0, nullable: 'Y', generated: false},
  })
  nombre?: number;

  @property({
    type: 'number',
    jsonSchema: {nullable: true},
    precision: 10,
    scale: 0,
    generated: false,
    mysql: {columnName: 'descripcion', dataType: 'int', dataLength: null, dataPrecision: 10, dataScale: 0, nullable: 'Y', generated: false},
  })
  descripcion?: number;

  @property({
    type: 'number',
    jsonSchema: {nullable: true},
    precision: 3,
    scale: 0,
    generated: false,
    mysql: {columnName: 'activo', dataType: 'tinyint', dataLength: null, dataPrecision: 3, dataScale: 0, nullable: 'Y', generated: false},
  })
  activo?: number;

  @belongsTo(() => Familias)
  familiaId?: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Subfamilias>) {
    super(data);
  }
}

export interface SubfamiliasRelations {
  // describe navigational properties here
}

export type SubfamiliasWithRelations = Subfamilias & SubfamiliasRelations;
