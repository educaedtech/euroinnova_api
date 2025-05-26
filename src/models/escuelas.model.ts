import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'escuelas'},
    foreignKeys: {
      escuelasIbfk_1Rel: {
        name: 'escuelasIbfk_1Rel',
        entity: 'Facultades',
        entityKey: 'id',
        foreignKey: 'facultad_id'
      }
    }
  }
})
export class Escuelas extends Entity {
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

  // @belongsTo(() => Facultades)
  // facultadId?: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Escuelas>) {
    super(data);
  }
}

export interface EscuelasRelations {
  // describe navigational properties here
}

export type EscuelasWithRelations = Escuelas & EscuelasRelations;
