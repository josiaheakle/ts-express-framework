import * as Express from "express";
import * as Morgan from "morgan";
import * as Winston from "winston";
import * as HTTPS from "https";

const path = require( "path" );
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');

export default class Server {

    public app                  : Express.Application;
    private logger              : Winston.Logger;

    constructor( initRoutes : Function , handlebarsHelpers? : Array<{index: Function}> ) {

        require('dotenv').config();
        this.app = Express();
        this.setConfig();
        this.setLogger();
        this.setViewEngine( handlebarsHelpers );
        this.setStaticFiles();
        this.setRoutes( initRoutes );

    }

    public start() {
        this.app.listen(process.env.PORT);
        this.logger.info(`Server started at ${process.env.PORT}`);
    }

    private setStaticFiles() {
        this.app.use('/assets', Express.static(path.join(__dirname, "../public")));
    }

    private setViewEngine( handlebarsHelpers? : Array<{index: Function}> ) {
        const hbs = exphbs.create({
            helpers : handlebarsHelpers
        });
        this.app.engine('handlebars', hbs.engine);
        this.app.set(`view engine`, `handlebars`);
        this.app.set(`views`, `./src/views`);
    }

    private setRoutes( initRoutes : Function ) {
        initRoutes(this.app);
    }

    private setConfig() {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({extended:false}));
        this.app.use(cookieParser(process.env.SESSION_SECRET)); 
        this.app.use(session({
          secret: process.env.SESSION_SECRET,
          cookie:{
            maxAge:36000,
            httpOnly:false,
            secure:false
            },
          resave: false,
          saveUninitialized: true
        })) 
    }

    private setLogger() {
		this.logger = Winston.createLogger({
            level: 'info',
            format: Winston.format.json(),
            defaultMeta: { service: 'user-service' },
            transports: [
              new Winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
              new Winston.transports.File({ filename: 'logs/combined.log' }),
            ],          
		});

		// Set up HTTP request logging
		const morganOptions: Morgan.Options = {
			stream: {
				write: (message) => {
					this.logger.info(message);
				},
			},
		};

		this.app.use(Morgan('combined', morganOptions));
	}

}