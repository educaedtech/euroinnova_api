import {BindingScope, injectable} from '@loopback/core';
import * as fs from 'fs';
import * as path from 'path';
import {Subject} from 'rxjs';
import winston from 'winston';

@injectable({scope: BindingScope.SINGLETON})
export class LoggerService {
  private static instanceCount = 0;
  public readonly instanceId: number;
  private logger: winston.Logger;
  public logStream = new Subject<string>();
  private logFilePath = path.join(__dirname, '../../logs/application.log');
  private isReady = false;
  private earlyLogBuffer: string[] = [];

  constructor() {
    this.instanceId = ++LoggerService.instanceCount;
    console.log(`📌 LoggerService instance #${this.instanceId} created`);

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({timestamp, level, message}) => {
          return `[${timestamp}] ${level}: ${message}`;
        })
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({filename: 'logs/application.log'})
      ]
    });

    setTimeout(() => {
      this.isReady = true;
      this.flushBuffer();
      console.log(`LoggerService #${this.instanceId} is now ready`);
    }, 1000);

    this.initializeLogCleanup();
  }

  log(message: string) {
    this.logger.info(message);

    if (!this.isReady) {
      this.earlyLogBuffer.push(message);
      return;
    }

    try {
      this.logStream.next(message);
    } catch (error) {
      console.error('Error sending to logStream:', error);
    }
  }

  error(message: string) {
    this.logger.error(message);
    const errorMessage = `ERROR: ${message}`;

    if (!this.isReady) {
      this.earlyLogBuffer.push(errorMessage);
      return;
    }

    try {
      this.logStream.next(errorMessage);
    } catch (error) {
      console.error('Error sending error to logStream:', error);
    }
  }

  private flushBuffer() {
    this.earlyLogBuffer.forEach(msg => {
      try {
        this.logStream.next(msg);
      } catch (error) {
        console.error('Error flushing buffered log:', error);
      }
    });
    this.earlyLogBuffer = [];
  }

  private initializeLogCleanup() {
    const interval = 1000 * 60 * 60 * 6;
    setInterval(() => {
      fs.writeFile(this.logFilePath, '', err => {
        if (err) console.error('Error cleaning log file:', err?.message);
        else console.log('🧹 Log file cleaned');
      });
    }, interval);
  }

  public getSubscriberCount(): number {
    return this.logStream.observers.length;
  }
}

