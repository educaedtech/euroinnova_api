import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';


const {MYSQL_HOST,
  MYSQL_PORT,
  MYSQL_USER,
  MYSQL_PASS,
  MYSQL_DB}
  = process.env;
console.log('ENV', MYSQL_HOST,
  MYSQL_PORT,
  MYSQL_USER,
  MYSQL_PASS,
  MYSQL_DB);
const config = {
  name: 'euroProductos',
  connector: 'mysql',
  url: `mysql://${MYSQL_USER}:${MYSQL_PASS}@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DB}`,
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  user: MYSQL_USER,
  password: MYSQL_PASS,
  database: MYSQL_DB
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class EuroProductosDataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'euroProductos';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.euroProductos', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
