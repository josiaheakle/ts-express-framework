import * as Express from "express";
import * as Winston from "winston";

const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const morgan = require('morgan');

interface ServerOptions {
    initRoutes: Function;
    apiPath?: string;
    staticFilePath?: string;
}

export class Server {

    public app: Express.Application;
    private logger: Winston.Logger;

    constructor(config: ServerOptions) {

        require('dotenv').config();

        this.app = Express();
        this.setConfig();
        this.setLogger();
        if (config.staticFilePath) {
            this.setStaticFiles(config.staticFilePath);
        }
        this.setRoutes(config.initRoutes);

    }

    public start() {
        this.app.listen(process.env.PORT);
        this.logger.info(`Server started at ${process.env.PORT}`);
    }

    private setStaticFiles(dirPath : string) {
        this.app.use('/assets', Express.static(dirPath));
    }

    private setRoutes(initRoutes: Function) {
        initRoutes(this.app);
    }

    private setConfig() {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(cookieParser(process.env.SESSION_SECRET));
        if (process.env.SESSION_SECRET) {
            this.app.use(session({
                secret: process.env.SESSION_SECRET,
                cookie: {
                    maxAge: 36000,
                    httpOnly: false,
                    secure: false
                },
                resave: false,
                saveUninitialized: true
            }))
        }
    }

    private setLogger() {

        const myFormat = Winston.format.printf(({ level, message, label, timestamp }) => {
            return `[${timestamp}] ${message}`;
        });

        this.logger = Winston.createLogger({
            level: 'info',
            format:  Winston.format.combine(
                Winston.format.timestamp(),
                myFormat
            ),
            defaultMeta: { service: 'user-service' },
            transports: [
                new Winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
                new Winston.transports.File({ filename: 'logs/combined.log' }),
            ],
        });

        const morganOptions = {
            stream: {
                write: (message) => {
                    this.logger.info(message);
                },
            },
        };
        this.app.use(morgan('combined', morganOptions));
    }

}