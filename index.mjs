#!/usr/bin/env node --experimental-modules

import GagScraper from './GagScraper';
import args from 'args';

args.option('group', 'The group/category will be scraped. Default: hot', 'hot')
    .option('type', 'The type of group. Default: hot. Possible values: hot|trending|new', 'hot')
    .option('count', 'Number of posts to be downloaded. Default: 100', 100)
    .option('path', 'Download path directory, directory will be created. Default: ./output', './output');

if (!process.argv) {
    args.showHelp();
    process.exit(0);
}
const flags = args.parse(process.argv);

var scraper = new GagScraper(flags.group, flags.type, flags.count, flags.path);
scraper.run();