import { inject, lifeCycleObserver, LifeCycleObserver } from '@loopback/core';
import { juggler } from '@loopback/repository';

const config = {
  name: 'euroProductos',
  connector: 'mysql',
  url: 'mysql://ismael:Anaisabel*123@localhost:3306/productos',
  host: 'localhost',
  port: 3306,
  user: 'ismael',
  password: 'Anaisabel*123',
  database: 'productos'
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
    @inject('datasources.config.euroProductos', { optional: true })
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
