import {Entity, model, property, belongsTo} from '@loopback/repository';
import {CualificacionesProfesionales} from '.';

@model({
  settings: {
    idInjection: false,
    mysql: {schema: 'productos', table: 'certificados_profesionales'},
    foreignKeys: {
      certificadosProfesionalesIbfk_1Rel: {
        name: 'certificadosProfesionalesIbfk_1Rel',
        entity: 'CualificacionesProfesionales',
        entityKey: 'id',
        foreignKey: 'cualificacionProfesionalId'
      }
    }
  }
})
export class CertificadosProfesionales extends Entity {
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

  @property({
    type: 'string',
    required: true,
    jsonSchema: {nullable: false},
    length: 255,
    generated: false,
    mysql: {columnName: 'codigo', dataType: 'varchar', dataLength: 255, dataPrecision: null, dataScale: null, nullable: 'N', generated: false},
  })
  codigo: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'capacitaciones_profesionales', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  capacitacionesProfesionales?: string;

  @belongsTo(() => CualificacionesProfesionales)
  cualificacionProfesionalId?: number;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 255,
    generated: false,
    mysql: {columnName: 'nivel_cualificacion_profesional', dataType: 'varchar', dataLength: 255, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  nivelCualificacionProfesional?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'observaciones', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  observaciones?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'referencia_legislacion', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  referenciaLegislacion?: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'requisitos', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  requisitos?: string;

  @property({
    type: 'number',
    jsonSchema: {nullable: true},
    precision: 5,
    scale: 0,
    generated: false,
    mysql: {columnName: 'horas', dataType: 'smallint', dataLength: null, dataPrecision: 5, dataScale: 0, nullable: 'Y', generated: false},
  })
  horas?: number;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
    length: 65535,
    generated: false,
    mysql: {columnName: 'observaciones_espacios_formativos', dataType: 'text', dataLength: 65535, dataPrecision: null, dataScale: null, nullable: 'Y', generated: false},
  })
  observacionesEspaciosFormativos?: string;

  @property({
    type: 'number',
    jsonSchema: {nullable: true},
    precision: 5,
    scale: 0,
    generated: false,
    mysql: {columnName: 'duracion_prueba_presencial_total', dataType: 'smallint', dataLength: null, dataPrecision: 5, dataScale: 0, nullable: 'Y', generated: false},
  })
  duracionPruebaPresencialTotal?: number;

  @property({
    type: 'number',
    jsonSchema: {nullable: true},
    precision: 5,
    scale: 0,
    generated: false,
    mysql: {columnName: 'horas_tutoria_presencial', dataType: 'smallint', dataLength: null, dataPrecision: 5, dataScale: 0, nullable: 'Y', generated: false},
  })
  horasTutoriaPresencial?: number;

  @property({
    type: 'number',
    jsonSchema: {nullable: true},
    precision: 3,
    scale: 0,
    generated: false,
    mysql: {columnName: 'imparticion_online', dataType: 'tinyint', dataLength: null, dataPrecision: 3, dataScale: 0, nullable: 'Y', generated: false},
  })
  imparticionOnline?: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<CertificadosProfesionales>) {
    super(data);
  }
}

export interface CertificadosProfesionalesRelations {
  // describe navigational properties here
}

export type CertificadosProfesionalesWithRelations = CertificadosProfesionales & CertificadosProfesionalesRelations;
