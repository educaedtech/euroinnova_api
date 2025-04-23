import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Idiomas,ImagenesTipos} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'imagenes'},
    foreignKeys: {
      imagenesIdiomasIdFkRel: {
        name: 'imagenesIdiomasIdFkRel',
        entity: 'Idiomas',
        entityKey: 'id',
        foreignKey: 'idiomaId'
      },
      imagenesTiposRel: {
        name: 'imagenesTiposRel',
        entity: 'ImagenesTipos',
        entityKey: 'id',
        foreignKey: 'tipoId'
      }
    }
  }
})
export class Imagenes extends Entity {
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
    mysql: {columnName: 'titulo', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  titulo?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'texto_alternativo', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  textoAlternativo?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'url', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  url?: string;

  @belongsTo(() => Idiomas)
  idiomaId?: number;

  @property({
    type: 'number',
    jsonSchema: {nullable: true},
    precision: 10,
    scale: 0,
    generated: false,
    mysql: {columnName: 'activo', dataType: 'int', dataLength: null, dataPrecision: 10, dataScale: 0, nullable: 'Y', generated: false},
  })
  activo?: number;

  @property({
    type: 'date',
    jsonSchema: {nullable: true},
    generated: false,
    mysql: {columnName: 'fecha_creacion', dataType: 'datetime', dataLength: null, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  fechaCreacion?: string;

  @belongsTo(() => ImagenesTipos)
  tipoId?: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Imagenes>) {
    super(data);
  }
}

export interface ImagenesRelations {
  // describe navigational properties here
}

export type ImagenesWithRelations = Imagenes & ImagenesRelations;
